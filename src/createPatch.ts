import * as ts from 'typescript';

/**
 * Generated using this template:
 * export function __PATCH_TEMPLATE__() {
 *  global.__jsMockStubHook(
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
  originalNode: ts.Node
) {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier("global"),
        factory.createIdentifier("__jsMockStubHook")
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
    )
  );
}
