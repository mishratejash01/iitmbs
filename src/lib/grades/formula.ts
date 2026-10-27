/**
 * A tiny, safe evaluator for grading formulas: numbers, names, + - * /,
 * brackets, max() and min(), and one comparison (>=, >, <=, <) for pass
 * conditions. Formulas are data, never JavaScript, so nothing is eval'd.
 */

type Node =
  | { type: 'num'; value: number }
  | { type: 'var'; name: string }
  | { type: 'neg'; arg: Node }
  | { type: 'bin'; op: '+' | '-' | '*' | '/'; left: Node; right: Node }
  | { type: 'call'; fn: 'max' | 'min'; args: Node[] }
  | { type: 'cmp'; op: '>=' | '>' | '<=' | '<'; left: Node; right: Node }

export type Formula = {
  /** Evaluates with the given scores; a missing name counts as 0. */
  evaluate: (values: Record<string, number>) => number
  /** Every name the formula reads. */
  names: string[]
}

const TOKEN = /\s*(\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|>=|<=|[-+*/(),<>])/y

function tokenize(source: string): string[] {
  const tokens: string[] = []
  TOKEN.lastIndex = 0
  while (TOKEN.lastIndex < source.length) {
    if (/^\s*$/.test(source.slice(TOKEN.lastIndex))) break
    const match = TOKEN.exec(source)
    if (!match) throw new Error(`Unexpected character at ${TOKEN.lastIndex} in "${source}"`)
    tokens.push(match[1]!)
  }
  return tokens
}

function parse(source: string): Node {
  const tokens = tokenize(source)
  let pos = 0
  const peek = () => tokens[pos]
  const take = (expected?: string) => {
    const token = tokens[pos++]
    if (token === undefined || (expected && token !== expected))
      throw new Error(`Expected ${expected ?? 'more'} in "${source}"`)
    return token
  }

  function comparison(): Node {
    const left = sum()
    const op = peek()
    if (op === '>=' || op === '>' || op === '<=' || op === '<') {
      take()
      return { type: 'cmp', op, left, right: sum() }
    }
    return left
  }
  function sum(): Node {
    let node = product()
    while (peek() === '+' || peek() === '-') {
      const op = take() as '+' | '-'
      node = { type: 'bin', op, left: node, right: product() }
    }
    return node
  }
  function product(): Node {
    let node = unary()
    while (peek() === '*' || peek() === '/') {
      const op = take() as '*' | '/'
      node = { type: 'bin', op, left: node, right: unary() }
    }
    return node
  }
  function unary(): Node {
    if (peek() === '-') {
      take()
      return { type: 'neg', arg: unary() }
    }
    return primary()
  }
  function primary(): Node {
    const token = take()
    if (token === '(') {
      const node = sum()
      take(')')
      return node
    }
    if (/^\d/.test(token)) return { type: 'num', value: Number(token) }
    if (/^[A-Za-z_]/.test(token)) {
      if (peek() === '(') {
        if (token !== 'max' && token !== 'min') throw new Error(`Unknown function ${token}()`)
        take('(')
        const args = [sum()]
        while (peek() === ',') {
          take(',')
          args.push(sum())
        }
        take(')')
        return { type: 'call', fn: token, args }
      }
      return { type: 'var', name: token }
    }
    throw new Error(`Unexpected "${token}" in "${source}"`)
  }

  const node = comparison()
  if (pos !== tokens.length) throw new Error(`Unexpected "${tokens[pos]}" in "${source}"`)
  return node
}

function evaluateNode(node: Node, values: Record<string, number>): number {
  switch (node.type) {
    case 'num':
      return node.value
    case 'var':
      return values[node.name] ?? 0
    case 'neg':
      return -evaluateNode(node.arg, values)
    case 'bin': {
      const a = evaluateNode(node.left, values)
      const b = evaluateNode(node.right, values)
      if (node.op === '+') return a + b
      if (node.op === '-') return a - b
      if (node.op === '*') return a * b
      return b === 0 ? 0 : a / b
    }
    case 'call': {
      const args = node.args.map((arg) => evaluateNode(arg, values))
      return node.fn === 'max' ? Math.max(...args) : Math.min(...args)
    }
    case 'cmp': {
      const a = evaluateNode(node.left, values)
      const b = evaluateNode(node.right, values)
      // A tolerance so 39.999999 from floating point still meets ">= 40".
      const ok =
        node.op === '>='
          ? a >= b - 1e-9
          : node.op === '>'
            ? a > b
            : node.op === '<='
              ? a <= b + 1e-9
              : a < b
      return ok ? 1 : 0
    }
  }
}

function collectNames(node: Node, into: Set<string>) {
  if (node.type === 'var') into.add(node.name)
  else if (node.type === 'neg') collectNames(node.arg, into)
  else if (node.type === 'bin' || node.type === 'cmp') {
    collectNames(node.left, into)
    collectNames(node.right, into)
  } else if (node.type === 'call') node.args.forEach((arg) => collectNames(arg, into))
}

const cache = new Map<string, Formula>()

/** Parses a formula once; throws on anything outside the grammar. */
export function compileFormula(source: string): Formula {
  const cached = cache.get(source)
  if (cached) return cached
  const tree = parse(source)
  const names = new Set<string>()
  collectNames(tree, names)
  const formula = {
    evaluate: (values: Record<string, number>) => evaluateNode(tree, values),
    names: [...names],
  }
  cache.set(source, formula)
  return formula
}
