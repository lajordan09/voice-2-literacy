import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      // Disable strict filesystem serving restrictions to allow serving files in 
      // paths containing special characters (e.g. '$HOME:')
      strict: false
    }
  }
});
