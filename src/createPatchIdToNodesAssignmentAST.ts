import * as ts from "typescript";

const DEBUG = false;
/**
 * Generated using this template:
 * global.__jsMockPatchIdToNodes = global.__jsMockPatchIdToNodes || {};
 * global.__jsMockPatchIdToNodes["{PATCH_ID}"] = global.__jsMockPatchIdToNodes["{PATCH_ID}"] || [];
 * global.__jsMockPatchIdToNodes["{PATCH_ID}"].push(...["{NODE_IDS}"]);
 *
 * on https://ts-ast-viewer.com/
 */
export function create(
  factory: ts.NodeFactory,
  patchId: string,
  nodeIds: string[]
) {
  const statements = [
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
        factory.createBinaryExpression(
          factory.createElementAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("global"),
              factory.createIdentifier("__jsMockPatchIdToNodes")
            ),
            factory.createStringLiteral(patchId)
          ),
          factory.createToken(ts.SyntaxKind.BarBarToken),
          factory.createArrayLiteralExpression([], false)
        )
      )
    ),
    factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createElementAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier("global"),
              factory.createIdentifier("__jsMockPatchIdToNodes")
            ),
            factory.createStringLiteral(patchId)
          ),
          factory.createIdentifier("push")
        ),
        undefined,
        [
          factory.createSpreadElement(
            factory.createArrayLiteralExpression(
              nodeIds.map((nodeId) => factory.createStringLiteral(nodeId)),
              false
            )
          ),
        ]
      )
    ),
  ];

  if (DEBUG) {
    return [
      ...statements,
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier("console"),
            factory.createIdentifier("log")
          ),
          undefined,
          [
            factory.createStringLiteral("global.__jsMockPatchIdToNodes"),
            factory.createPropertyAccessExpression(
              factory.createIdentifier("global"),
              factory.createIdentifier("__jsMockPatchIdToNodes")
            ),
          ]
        )
      ),
    ];
  }
  return statements;
}
