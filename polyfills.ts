import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// URL 폴리필
if (typeof globalThis.URL === 'undefined') {
  polyfillGlobal('URL', () => {
    class URL {
      constructor(input: string, base?: string) {
        if (base) {
          return new globalThis.URL(input, base);
        }
        return new globalThis.URL(input);
      }
      
      get href() {
        return this.toString();
      }
      
      toString() {
        return this.href;
      }
    }
    return URL;
  });
}

// TextDecoder 폴리필
if (typeof globalThis.TextDecoder === 'undefined') {
  polyfillGlobal('TextDecoder', () => {
    class TextDecoder {
      encoding: string;
      fatal: boolean;
      ignoreBOM: boolean;

      constructor(encoding = 'utf-8', options: { fatal?: boolean; ignoreBOM?: boolean } = {}) {
        this.encoding = encoding.toLowerCase();
        this.fatal = options.fatal || false;
        this.ignoreBOM = options.ignoreBOM || false;
      }

      decode(input?: ArrayBuffer | ArrayBufferView | null, options?: { stream?: boolean }) {
        if (!input) return '';
        const buffer = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
        return new TextDecoder().decode(buffer);
      }
    }
    return TextDecoder;
  });
}

// URLSearchParams 폴리필
if (typeof globalThis.URLSearchParams === 'undefined') {
  polyfillGlobal('URLSearchParams', () => {
    class URLSearchParams {
      private params: Map<string, string[]>;

      constructor(init?: string | URLSearchParams | Record<string, string> | [string, string][]) {
        this.params = new Map();

        if (typeof init === 'string') {
          this.fromString(init);
        } else if (init instanceof URLSearchParams) {
          init.forEach((value, key) => this.append(key, value));
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.append(key, value));
        } else if (init && typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.append(key, value as string));
        }
      }

      private fromString(str: string) {
        if (str.startsWith('?')) str = str.slice(1);
        str.split('&').forEach(pair => {
          const [key, value] = pair.split('=').map(decodeURIComponent);
          this.append(key, value || '');
        });
      }

      append(name: string, value: string) {
        const values = this.params.get(name) || [];
        values.push(value);
        this.params.set(name, values);
      }

      get(name: string): string | null {
        const values = this.params.get(name);
        return values ? values[0] : null;
      }

      getAll(name: string): string[] {
        return this.params.get(name) || [];
      }

      toString(): string {
        return Array.from(this.params.entries())
          .flatMap(([key, values]) => 
            values.map(value => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          )
          .join('&');
      }
    }
    return URLSearchParams;
  });
}
