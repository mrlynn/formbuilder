/**
 * Tests for AI Validation Generator
 */

import { COMMON_PATTERNS } from '@/lib/ai/validationGenerator';

describe('Validation Generator', () => {
  // ===========================================
  // COMMON_PATTERNS
  // ===========================================
  describe('COMMON_PATTERNS', () => {
    describe('US SSN pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.us_ssn.pattern);

      it('should match valid SSN format', () => {
        expect(pattern.test('123-45-6789')).toBe(true);
        expect(pattern.test('000-00-0000')).toBe(true);
        expect(pattern.test('999-99-9999')).toBe(true);
      });

      it('should reject invalid SSN format', () => {
        expect(pattern.test('123456789')).toBe(false);
        expect(pattern.test('123-456-789')).toBe(false);
        expect(pattern.test('12-345-6789')).toBe(false);
        expect(pattern.test('abc-de-fghi')).toBe(false);
      });
    });

    describe('US ZIP code pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.us_zip.pattern);

      it('should match valid 5-digit ZIP', () => {
        expect(pattern.test('12345')).toBe(true);
        expect(pattern.test('00000')).toBe(true);
        expect(pattern.test('99999')).toBe(true);
      });

      it('should match valid ZIP+4 format', () => {
        expect(pattern.test('12345-6789')).toBe(true);
        expect(pattern.test('00000-0000')).toBe(true);
      });

      it('should reject invalid ZIP formats', () => {
        expect(pattern.test('1234')).toBe(false);
        expect(pattern.test('123456')).toBe(false);
        expect(pattern.test('12345-678')).toBe(false);
        expect(pattern.test('abcde')).toBe(false);
      });
    });

    describe('UK postcode pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.uk_postcode.pattern);

      it('should match valid UK postcodes', () => {
        expect(pattern.test('SW1A 1AA')).toBe(true);
        expect(pattern.test('M1 1AA')).toBe(true);
        expect(pattern.test('B33 8TH')).toBe(true);
        expect(pattern.test('CR2 6XH')).toBe(true);
      });
    });

    describe('Canadian postal code pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.canada_postal.pattern);

      it('should match valid Canadian postal codes', () => {
        expect(pattern.test('K1A 0B1')).toBe(true);
        expect(pattern.test('K1A0B1')).toBe(true);
        expect(pattern.test('V5K 0A1')).toBe(true);
      });
    });

    describe('Employee ID pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.employee_id_alpha_num.pattern);

      it('should match valid employee IDs (2 letters + 4-6 digits)', () => {
        expect(pattern.test('AB1234')).toBe(true);
        expect(pattern.test('XY12345')).toBe(true);
        expect(pattern.test('MN123456')).toBe(true);
      });

      it('should reject invalid employee IDs', () => {
        expect(pattern.test('A1234')).toBe(false); // Only 1 letter
        expect(pattern.test('ABC1234')).toBe(false); // 3 letters
        expect(pattern.test('AB123')).toBe(false); // Only 3 digits
        expect(pattern.test('ab1234')).toBe(false); // Lowercase
        expect(pattern.test('12AB34')).toBe(false); // Wrong order
      });
    });

    describe('Product code pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.product_code.pattern);

      it('should match valid product codes (XXX-NNN-X)', () => {
        expect(pattern.test('PRD-001-A')).toBe(true);
        expect(pattern.test('ABC-123-Z')).toBe(true);
        expect(pattern.test('XYZ-999-M')).toBe(true);
      });

      it('should reject invalid product codes', () => {
        expect(pattern.test('PR-001-A')).toBe(false); // Only 2 letters
        expect(pattern.test('PRD-01-A')).toBe(false); // Only 2 digits
        expect(pattern.test('PRD001A')).toBe(false); // No dashes
        expect(pattern.test('prd-001-a')).toBe(false); // Lowercase
      });
    });

    describe('Order number pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.order_number.pattern);

      it('should match valid order numbers', () => {
        expect(pattern.test('ORD-12345678')).toBe(true);
        expect(pattern.test('ORD-00000000')).toBe(true);
        expect(pattern.test('ORD-99999999')).toBe(true);
      });

      it('should reject invalid order numbers', () => {
        expect(pattern.test('ORD12345678')).toBe(false); // No dash
        expect(pattern.test('ORD-1234567')).toBe(false); // 7 digits
        expect(pattern.test('ORDER-12345678')).toBe(false); // Wrong prefix
      });
    });

    describe('IP v4 pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.ip_v4.pattern);

      it('should match valid IPv4 addresses', () => {
        expect(pattern.test('192.168.1.1')).toBe(true);
        expect(pattern.test('0.0.0.0')).toBe(true);
        expect(pattern.test('255.255.255.255')).toBe(true);
        expect(pattern.test('10.0.0.1')).toBe(true);
      });

      it('should reject invalid IPv4 addresses', () => {
        expect(pattern.test('256.0.0.1')).toBe(false); // 256 > 255
        expect(pattern.test('192.168.1')).toBe(false); // Missing octet
        expect(pattern.test('192.168.1.1.1')).toBe(false); // Extra octet
        expect(pattern.test('abc.def.ghi.jkl')).toBe(false); // Letters
      });
    });

    describe('MAC address pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.mac_address.pattern);

      it('should match valid MAC addresses with colons', () => {
        expect(pattern.test('00:1A:2B:3C:4D:5E')).toBe(true);
        expect(pattern.test('aa:bb:cc:dd:ee:ff')).toBe(true);
      });

      it('should match valid MAC addresses with dashes', () => {
        expect(pattern.test('00-1A-2B-3C-4D-5E')).toBe(true);
      });

      it('should reject invalid MAC addresses', () => {
        expect(pattern.test('001A2B3C4D5E')).toBe(false); // No separators
        expect(pattern.test('00:1A:2B:3C:4D')).toBe(false); // Missing pair
        expect(pattern.test('GG:1A:2B:3C:4D:5E')).toBe(false); // Invalid hex
      });
    });

    describe('Hex color pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.hex_color.pattern);

      it('should match valid 6-digit hex colors', () => {
        expect(pattern.test('#FF5500')).toBe(true);
        expect(pattern.test('#000000')).toBe(true);
        expect(pattern.test('#ffffff')).toBe(true);
        expect(pattern.test('#aAbBcC')).toBe(true);
      });

      it('should match valid 3-digit hex colors', () => {
        expect(pattern.test('#F50')).toBe(true);
        expect(pattern.test('#000')).toBe(true);
        expect(pattern.test('#fff')).toBe(true);
      });

      it('should reject invalid hex colors', () => {
        expect(pattern.test('FF5500')).toBe(false); // No #
        expect(pattern.test('#F5')).toBe(false); // 2 digits
        expect(pattern.test('#GGGGGG')).toBe(false); // Invalid hex
        expect(pattern.test('#FF55001')).toBe(false); // 7 digits
      });
    });

    describe('Username pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.username.pattern);

      it('should match valid usernames', () => {
        expect(pattern.test('john')).toBe(true);
        expect(pattern.test('john_doe')).toBe(true);
        expect(pattern.test('john_doe123')).toBe(true);
        expect(pattern.test('JohnDoe')).toBe(true);
        expect(pattern.test('abc')).toBe(true); // 3 chars minimum
      });

      it('should reject invalid usernames', () => {
        expect(pattern.test('jo')).toBe(false); // Too short
        expect(pattern.test('123john')).toBe(false); // Starts with number
        expect(pattern.test('_john')).toBe(false); // Starts with underscore
        expect(pattern.test('john-doe')).toBe(false); // Dash not allowed
        expect(pattern.test('abcdefghijklmnopqrstu')).toBe(false); // Too long (21 chars)
      });
    });

    describe('Slug pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.slug.pattern);

      it('should match valid slugs', () => {
        expect(pattern.test('my-blog-post')).toBe(true);
        expect(pattern.test('article')).toBe(true);
        expect(pattern.test('post-123')).toBe(true);
        expect(pattern.test('a-b-c')).toBe(true);
      });

      it('should reject invalid slugs', () => {
        expect(pattern.test('My-Blog-Post')).toBe(false); // Uppercase
        expect(pattern.test('my_blog_post')).toBe(false); // Underscores
        expect(pattern.test('-my-post')).toBe(false); // Starts with dash
        expect(pattern.test('my-post-')).toBe(false); // Ends with dash
        expect(pattern.test('my--post')).toBe(false); // Double dash
      });
    });

    describe('Time patterns', () => {
      it('should match valid 24-hour time', () => {
        const pattern = new RegExp(COMMON_PATTERNS.time_24h.pattern);
        expect(pattern.test('00:00')).toBe(true);
        expect(pattern.test('14:30')).toBe(true);
        expect(pattern.test('23:59')).toBe(true);
        expect(pattern.test('24:00')).toBe(false); // 24 is invalid
        expect(pattern.test('14:60')).toBe(false); // 60 minutes invalid
      });

      it('should match valid 12-hour time', () => {
        const pattern = new RegExp(COMMON_PATTERNS.time_12h.pattern);
        expect(pattern.test('12:00 AM')).toBe(true);
        expect(pattern.test('2:30 PM')).toBe(true);
        expect(pattern.test('11:59 PM')).toBe(true);
        expect(pattern.test('13:00 PM')).toBe(false); // 13 is invalid
        expect(pattern.test('12:00')).toBe(false); // Missing AM/PM
      });
    });

    describe('Alphanumeric pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.alphanumeric.pattern);

      it('should match alphanumeric strings', () => {
        expect(pattern.test('abc123')).toBe(true);
        expect(pattern.test('ABC')).toBe(true);
        expect(pattern.test('123')).toBe(true);
        expect(pattern.test('AbC123xYz')).toBe(true);
      });

      it('should reject non-alphanumeric strings', () => {
        expect(pattern.test('abc 123')).toBe(false); // Space
        expect(pattern.test('abc-123')).toBe(false); // Dash
        expect(pattern.test('abc_123')).toBe(false); // Underscore
        expect(pattern.test('')).toBe(false); // Empty
      });
    });

    describe('Letters only pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.letters_only.pattern);

      it('should match letters only', () => {
        expect(pattern.test('Hello')).toBe(true);
        expect(pattern.test('abc')).toBe(true);
        expect(pattern.test('XYZ')).toBe(true);
      });

      it('should reject non-letter strings', () => {
        expect(pattern.test('Hello123')).toBe(false);
        expect(pattern.test('Hello World')).toBe(false);
        expect(pattern.test('Hello!')).toBe(false);
      });
    });

    describe('No special chars pattern', () => {
      const pattern = new RegExp(COMMON_PATTERNS.no_special_chars.pattern);

      it('should match letters, numbers, and spaces', () => {
        expect(pattern.test('Hello World')).toBe(true);
        expect(pattern.test('abc 123')).toBe(true);
        expect(pattern.test('Test')).toBe(true);
      });

      it('should reject special characters', () => {
        expect(pattern.test('Hello!')).toBe(false);
        expect(pattern.test('test@example')).toBe(false);
        expect(pattern.test('hello-world')).toBe(false);
      });
    });
  });

  // ===========================================
  // Pattern metadata
  // ===========================================
  describe('Pattern metadata', () => {
    it('should have descriptions for all patterns', () => {
      Object.values(COMMON_PATTERNS).forEach((pattern) => {
        expect(pattern.description).toBeDefined();
        expect(typeof pattern.description).toBe('string');
        expect(pattern.description.length).toBeGreaterThan(0);
      });
    });

    it('should have examples for all patterns', () => {
      Object.values(COMMON_PATTERNS).forEach((pattern) => {
        expect(pattern.example).toBeDefined();
        expect(typeof pattern.example).toBe('string');
        expect(pattern.example.length).toBeGreaterThan(0);
      });
    });

    it('should have valid regex patterns', () => {
      Object.entries(COMMON_PATTERNS).forEach(([key, patternDef]) => {
        expect(() => new RegExp(patternDef.pattern)).not.toThrow();
      });
    });

    it('examples should match their own patterns', () => {
      Object.entries(COMMON_PATTERNS).forEach(([key, patternDef]) => {
        // Split examples if they contain "or"
        const examples = patternDef.example.split(' or ');
        const regex = new RegExp(patternDef.pattern);

        examples.forEach((example) => {
          const trimmed = example.trim();
          const matches = regex.test(trimmed);
          if (!matches) {
            console.log(`Pattern ${key}: Example "${trimmed}" doesn't match pattern "${patternDef.pattern}"`);
          }
          expect(matches).toBe(true);
        });
      });
    });
  });
});
