from __future__ import annotations

import ast
import operator
from typing import Callable

BinaryOp = Callable[[float, float], float]
UnaryOp = Callable[[float], float]

_ALLOWED_OPERATORS: dict[type[ast.operator], BinaryOp] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
}

_ALLOWED_UNARY_OPERATORS: dict[type[ast.unaryop], UnaryOp] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


class UnsafeExpressionError(ValueError):
    """Raised when an expression contains disallowed syntax."""


def evaluate(expr: str) -> float:
    """Safely evaluate a simple arithmetic expression."""

    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as exc:  # pragma: no cover - defensive
        raise UnsafeExpressionError("invalid syntax") from exc

    return _eval_node(tree.body)


def _eval_node(node: ast.AST) -> float:
    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_OPERATORS:
            raise UnsafeExpressionError("unsupported operator")
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        func = _ALLOWED_OPERATORS[op_type]
        return float(func(left, right))
    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_UNARY_OPERATORS:
            raise UnsafeExpressionError("unsupported unary operator")
        operand = _eval_node(node.operand)
        func = _ALLOWED_UNARY_OPERATORS[op_type]
        return float(func(operand))
    if isinstance(node, ast.Constant):
        value = node.value
        if not isinstance(value, (int, float)):
            raise UnsafeExpressionError("non-numeric literal")
        return float(value)
    if isinstance(node, ast.Num):  # pragma: no cover - Python <3.8 compatibility
        return float(node.n)
    raise UnsafeExpressionError("unsupported expression")
