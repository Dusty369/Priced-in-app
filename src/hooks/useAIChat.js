import { useState } from 'react';
import { extractSearchSuggestions } from '../utils/searchSuggestions';

/**
 * Extract JSON from AI response text using balanced brace matching
 */
function extractJSON(text) {
  // First, try to find JSON in a code block (```json ... ``` or ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed.materials) return parsed;
    } catch (e) { /* continue to other methods */ }
  }

  // Find the first { that starts a JSON object
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return null;

  // Use balanced brace counting to find the matching }
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;

      if (braceCount === 0) {
        const jsonStr = text.slice(startIdx, i + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.materials && Array.isArray(parsed.materials)) {
            return parsed;
          }
        } catch (e) {
          const nextStart = text.indexOf('{', i + 1);
          if (nextStart !== -1) {
            return extractJSON(text.slice(nextStart));
          }
        }
        break;
      }
    }
  }

  return null;
}

/**
 * Format AI JSON response into readable chat message
 */
function formatAIResponse(json, labourRates) {
  let formattedContent = '';

  if (json.summary) {
    formattedContent += `**${json.summary}**\n\n`;
  }

  if (json.calculations) {
    formattedContent += '🧮 **Calculations:**\n';
    if (Array.isArray(json.calculations)) {
      json.calculations.forEach(calc => {
        formattedContent += `• **${calc.item}:** ${calc.working}\n`;
      });
    } else {
      formattedContent += `${json.calculations}\n`;
    }
    formattedContent += '\n';
  }

  if (json.materials && json.materials.length > 0) {
    formattedContent += '📦 **Materials needed:**\n';
    json.materials.forEach(m => {
      formattedContent += `• ${m.qty} × ${m.name}\n`;
    });
    formattedContent += '\n';
  }

  if (json.labour && json.labour.totalHours) {
    const rate = labourRates.builder || 95;
    const cost = rate * json.labour.totalHours;
    formattedContent += '👷 **Labour estimate:**\n';
    formattedContent += `• ${json.labour.totalHours} builder hours ($${cost.toFixed(0)})\n`;
    if (json.labour.description) {
      formattedContent += `  ${json.labour.description}\n`;
    }
    formattedContent += '\n';
  }

  if (json.notes && json.notes.length > 0) {
    formattedContent += '📝 **Important notes:**\n';
    json.notes.forEach(note => {
      formattedContent += `• ${note}\n`;
    });
    formattedContent += '\n';
  }

  if (json.warnings && json.warnings.length > 0) {
    formattedContent += '⚠️ **Warnings:**\n';
    json.warnings.forEach(warning => {
      formattedContent += `• ${warning}\n`;
    });
  }

  return formattedContent.trim();
}

/**
 * Custom hook for AI chat functionality
 * @param {Object} options
 * @param {Object} options.labourRates - Labour rates by role
 * @param {Function} options.onAddToCart - Callback to add items to cart
 * @param {Function} options.onAddLabourItem - Callback to add labour item
 * @param {Function} options.onNavigateToQuote - Callback to navigate to quote page
 * @param {Array} options.allMaterials - All materials array
 * @param {Map} options.materialWordIndex - Word index for material lookup
 */
export function useAIChat({
  labourRates,
  onAddToCart,
  onAddLabourItem,
  onNavigateToQuote,
  allMaterials,
  materialWordIndex
}) {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Send message to AI
  const sendAIMessage = async () => {
    if (!chatInput.trim() || aiLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'project',
          materials: [],
          labourRates,
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      const data = await response.json();

      if (data.error) {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}. Make sure your API key is set in .env.local`,
          type: 'error'
        }]);
      } else {
        const text = data.content?.find(c => c.type === 'text')?.text || 'No response';

        try {
          const json = extractJSON(text);
          if (json) {
            const formattedContent = formatAIResponse(json, labourRates);
            setChatHistory(prev => [...prev, {
              role: 'assistant',
              content: formattedContent,
              parsed: json
            }]);
          } else {
            setChatHistory(prev => [...prev, { role: 'assistant', content: text }]);
          }
        } catch (e) {
          setChatHistory(prev => [...prev, { role: 'assistant', content: text }]);
        }
      }
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect. Check your internet connection.'
      }]);
    }

    setAiLoading(false);
  };

  // Add AI-suggested materials to quote
  const addMaterialsToQuote = (materials, msgIndex) => {
    if (!materials || materials.length === 0) return;

    const newItems = [];
    const unmatched = [];

    materials.forEach(suggested => {
      const searchTerm = (suggested.searchTerm || suggested.name || "").toUpperCase();
      const searchWords = searchTerm.replace(/[^A-Z0-9.]/g, " ").split(" ").filter(w => w.length > 1);

      let qty = suggested.qty;
      if (typeof qty === 'string') qty = parseFloat(qty);
      if (!qty || isNaN(qty) || qty <= 0) qty = 1;
      qty = Math.ceil(qty);

      // Sanity check for common unit confusion errors
      const itemName = (suggested.name || '').toLowerCase();
      const unit = (suggested.unit || '').toLowerCase();

      // Screws/nails: if qty > 50 boxes, likely meant individual screws
      if ((itemName.includes('screw') || itemName.includes('nail')) &&
          (unit === 'box' || unit === 'pk') && qty > 50) {
        // Assume AI output individual count, convert to boxes (assume 200/box)
        qty = Math.ceil(qty / 200);
        if (qty < 1) qty = 1;
      }

      // Paint/stain: if qty > 20 tins, likely meant m² coverage
      if ((itemName.includes('paint') || itemName.includes('stain') || itemName.includes('finish')) &&
          qty > 20) {
        // Assume AI output m² coverage, convert to tins (assume 12m²/L, 5L tin)
        qty = Math.ceil(qty / (12 * 5));
        if (qty < 1) qty = 1;
      }

      // Concrete bags: if qty > 200, likely meant kg not bags
      if (itemName.includes('concrete') && qty > 200) {
        qty = Math.ceil(qty / 20); // 20kg bags
      }

      if (searchWords.length === 0) {
        unmatched.push({ name: suggested.name || 'Unknown item', qty, reason: 'No search term' });
        return;
      }

      let bestMatch = null;
      let bestScore = 0;

      const keyWords = searchWords.filter(w =>
        ["AQUALINE", "ULTRALINE", "FYRELINE", "STANDARD", "PINK", "EARTHWOOL", "H3.1", "H3.2", "H4", "H5", "H1.2", "SG8", "KD"].includes(w)
      );

      let candidateIndices = null;
      const wordsToMatch = keyWords.length > 0 ? keyWords : searchWords.slice(0, 3);

      for (const word of wordsToMatch) {
        const indices = materialWordIndex.get(word);
        if (!indices) {
          candidateIndices = new Set();
          break;
        }
        if (candidateIndices === null) {
          candidateIndices = new Set(indices);
        } else {
          candidateIndices = new Set(indices.filter(i => candidateIndices.has(i)));
        }
        if (candidateIndices.size === 0) break;
      }

      if (candidateIndices && candidateIndices.size > 0) {
        for (const idx of candidateIndices) {
          const m = allMaterials[idx];
          const matName = m.name.toUpperCase();
          const score = searchWords.filter(word => matName.includes(word)).length;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = m;
          }
        }
      }

      if (bestMatch) {
        // Use AI's pre-calculated qty if available, otherwise use raw qty
        let finalQty = qty;

        // If AI provided packaging calculation, validate it
        if (suggested.totalNeeded && suggested.packageSize && bestMatch.packaging) {
          const expectedQty = Math.ceil(suggested.totalNeeded / (bestMatch.packaging.unitsPerPackage || 1));
          // Use AI's qty if reasonable, otherwise recalculate
          if (qty > 0 && qty <= expectedQty * 2) {
            finalQty = qty;
          } else {
            finalQty = expectedQty;
          }
        }

        // Final sanity check - warn if qty seems unreasonable
        const lineTotal = finalQty * (bestMatch.price || 0);
        const warning = lineTotal > 5000 ? `High value: $${lineTotal.toFixed(0)}` : null;

        const existing = newItems.find(i => i.id === bestMatch.id);
        if (existing) {
          existing.qty += finalQty;
        } else {
          newItems.push({
            ...bestMatch,
            qty: finalQty,
            calculation: suggested.calculation,
            warning
          });
        }
      } else {
        const itemName = suggested.name || searchTerm;
        const suggestedSearches = extractSearchSuggestions(itemName, suggested.searchTerm);
        unmatched.push({
          name: itemName,
          qty,
          searchTerm: suggested.searchTerm,
          reason: 'No match in database',
          suggestions: suggestedSearches
        });
      }
    });

    // Add matched items to cart
    if (newItems.length > 0) {
      onAddToCart(newItems);
    }

    // Update chat with match results
    setChatHistory(prev => {
      const updated = prev.map((msg, idx) =>
        idx === msgIndex ? {
          ...msg,
          added: true,
          matchResults: {
            matched: newItems.length,
            total: materials.length,
            unmatched: unmatched.length > 0 ? unmatched : null
          }
        } : msg
      );

      if (unmatched.length > 0) {
        updated.push({
          role: 'system',
          type: 'warning',
          content: `${unmatched.length} of ${materials.length} items couldn't be matched`,
          unmatched: unmatched,
          matched: newItems.length
        });
      }

      return updated;
    });

    onNavigateToQuote();
  };

  // Add AI-suggested labour to quote
  const addLabourToQuote = (labour) => {
    if (!labour || !labour.totalHours) return;

    onAddLabourItem({
      role: 'builder',
      hours: labour.totalHours,
      description: labour.description || 'Builder labour'
    });
  };

  return {
    chatInput,
    setChatInput,
    chatHistory,
    setChatHistory,
    aiLoading,
    sendAIMessage,
    addMaterialsToQuote,
    addLabourToQuote
  };
}

export default useAIChat;
