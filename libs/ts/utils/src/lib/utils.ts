// String utilities
export class StringUtils {
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static camelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  }

  static snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  static kebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }

  static truncate(str: string, length: number, suffix = '...'): string {
    return str.length > length ? str.substring(0, length) + suffix : str;
  }
}

// Array utilities
export class ArrayUtils {
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      (result[groupKey] = result[groupKey] || []).push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
}

// Date utilities
export class DateUtils {
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static formatDate(date: Date, format = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
}

// Object utilities
export class ObjectUtils {
  static pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  static omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  static deepClone<T extends object>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
