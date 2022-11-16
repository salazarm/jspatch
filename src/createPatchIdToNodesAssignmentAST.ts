import * as ts from 'typescript';

/**
 * Generated using this template:
 * global.__jsMockPatchIdToNodes = global.__jsMockPatchIdToNodes || {};
 * global.__jsMockPatchIdToNodes["{PATCH_ID}"] = "{NODE_IDS}";
 *
 * on https://ts-ast-viewer.com/
 */
export function create(
  factory: ts.NodeFactory,
  patchId: string,
  nodeIds: string[]
) {
  return [
    factory.createExpressionStatement(
      factory.createBinaryExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier("global"),
          factory.createIdentifier("__jsMockPatchIdToNodes")
        ),
        factory.createToken(ts.SyntaxKind.EqualsToken),
        factory.createBinaryExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier("global"),
            factory.createIdentifier("__jsMockPatchIdToNodes")
          ),
          factory.createToken(ts.SyntaxKind.BarBarToken),
          factory.createObjectLiteralExpression([], false)
        )
      )
    ),
    factory.createExpressionStatement(
      factory.createBinaryExpression(
        factory.createElementAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier("global"),
            factory.createIdentifier("__jsMockPatchIdToNodes")
          ),
          factory.createStringLiteral(patchId)
        ),
        factory.createToken(ts.SyntaxKind.EqualsToken),
        factory.createArrayLiteralExpression(
          nodeIds.map((nodeId) => factory.createStringLiteral(nodeId)),
          false
        )
      )
    ),
  ];
}
