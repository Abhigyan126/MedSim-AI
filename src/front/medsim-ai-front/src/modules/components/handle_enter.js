
// Handle key press on 'Enter' key
export const handleKeyDown = (e, callback) => {
    if (e.key === 'Enter' && typeof callback === 'function') {
      callback();
    }
  };
