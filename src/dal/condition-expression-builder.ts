export interface ConditionExpressionParts {
  ConditionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
}

class AttrHelper {
  constructor(private builder: ConditionExpressionBuilder, private name: string) {}

  notExists(): ConditionExpressionBuilder {
    const token = this.builder.nextNameToken();
    this.builder.names[token] = this.name;
    this.builder.parts.push(`attribute_not_exists(${token})`);
    return this.builder;
  }

  exists(): ConditionExpressionBuilder {
    const token = this.builder.nextNameToken();
    this.builder.names[token] = this.name;
    this.builder.parts.push(`attribute_exists(${token})`);
    return this.builder;
  }

  eq(value: any): ConditionExpressionBuilder {
    const nameToken = this.builder.nextNameToken();
    const valToken = this.builder.nextValueToken();
    this.builder.names[nameToken] = this.name;
    this.builder.values[valToken] = value;
    this.builder.parts.push(`${nameToken} = ${valToken}`);
    return this.builder;
  }

  beginsWith(value: any): ConditionExpressionBuilder {
    const nameToken = this.builder.nextNameToken();
    const valToken = this.builder.nextValueToken();
    this.builder.names[nameToken] = this.name;
    this.builder.values[valToken] = value;
    this.builder.parts.push(`begins_with(${nameToken}, ${valToken})`);
    return this.builder;
  }

  contains(value: any): ConditionExpressionBuilder {
    const nameToken = this.builder.nextNameToken();
    const valToken = this.builder.nextValueToken();
    this.builder.names[nameToken] = this.name;
    this.builder.values[valToken] = value;
    this.builder.parts.push(`contains(${nameToken}, ${valToken})`);
    return this.builder;
  }
}

export class ConditionExpressionBuilder {
  parts: string[] = [];
  names: Record<string, string> = {};
  values: Record<string, unknown> = {};
  private counter = 0;

  static attr(name: string): AttrHelper {
    const b = new ConditionExpressionBuilder();
    return new AttrHelper(b, name);
  }

  static attributeNotExists(name: string): ConditionExpressionParts {
    const b = new ConditionExpressionBuilder();
    b.attr(name).notExists();
    return b.toExpression();
  }

  attr(name: string): AttrHelper {
    return new AttrHelper(this, name);
  }

  nextNameToken(): string {
    return `#n${this.counter++}`;
  }

  nextValueToken(): string {
    return `:v${this.counter++}`;
  }

  and(...builders: ConditionExpressionBuilder[]): ConditionExpressionBuilder {
    builders.forEach((b) => {
      if (b.parts.length) {
        this.parts.push(`(${b.parts.join(' AND ')})`);
        Object.assign(this.names, b.names);
        Object.assign(this.values, b.values);
      }
    });
    return this;
  }

  toExpression(prefix?: string): ConditionExpressionParts {
    if (this.parts.length === 0) return {};

    let expr = this.parts.join(' AND ');
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    if (prefix) {
      // remap tokens to include prefix to avoid collisions
      Object.keys(this.names).forEach((k) => {
        const newK = `${k}_${prefix}`;
        expr = expr.split(k).join(newK);
        names[newK] = this.names[k] || '';
      });

      Object.keys(this.values).forEach((k) => {
        const newK = `${k}_${prefix}`;
        expr = expr.split(k).join(newK);
        values[newK] = this.values[k];
      });
    } else {
      Object.assign(names, this.names);
      Object.assign(values, this.values);
    }

    const result: ConditionExpressionParts = {
      ConditionExpression: expr,
    };

    if (Object.keys(names).length) result.ExpressionAttributeNames = names;
    if (Object.keys(values).length) result.ExpressionAttributeValues = values;

    return result;
  }
}

export default ConditionExpressionBuilder;
