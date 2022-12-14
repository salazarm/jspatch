import * as ts from "typescript";

/**
 * Generated using this template:
 * export function __PATCH_TEMPLATE__() {
 *  global.__jsPatchHook(
 *    "{nodeId}",
 *    () => {originalNode}
 *  );
 * }
 *
 * on https://ts-ast-viewer.com/
 */

export function create(
  factory: ts.NodeFactory,
  nodeId: string,
  originalNode: ts.Node,
  parentNode?: ts.Node
) {
  const patch = factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier("global"),
      factory.createIdentifier("__jsPatchHook")
    ),
    undefined,
    [
      factory.createStringLiteral(nodeId),
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        originalNode as any
      ),
    ]
  );

  // If this is a short hand property assignment then we need to expand it.
  if (
    parentNode &&
    ts.isShorthandPropertyAssignment(parentNode) &&
    ts.isIdentifier(originalNode)
  ) {
    return ts.visitNode(parentNode, () => {
      return factory.createPropertyAssignment(
        originalNode.escapedText as string,
        patch
      );
    });
  }
  return patch;
}
