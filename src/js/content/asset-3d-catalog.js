(function () {
    window.Asset3DCatalog = 
    {
      "schemaVersion": 1,
      "assetVersionTag": "20260624h",
      "assets": {
        "bronze_pickaxe": {
          "id": "bronze_pickaxe",
          "name": "Bronze Pickaxe",
          "kind": "tool",
          "family": "pickaxe",
          "tier": "bronze",
          "runtime": {
            "format": "glb",
            "path": "assets/3d/bronze_pickaxe.glb"
          },
          "inventoryIcon": {
            "path": "assets/pixel/bronze_pickaxe.png",
            "generatedFrom": "assets/3d/bronze_pickaxe.glb",
            "reviewPath": "tmp/3d-icon-review/bronze_pickaxe.png",
            "camera": "tool_side"
          },
          "attachment": {
            "slot": "rightHand",
            "target": "axe",
            "position": [
              0,
              0,
              0
            ],
            "gripPoint": [
              -0.0674,
              -0.9984,
              -0.0197
            ],
            "rotation": [
              0.9561333749,
              -1.5707963268,
              0
            ],
            "scale": 0.36
          },
          "groundPose": {
            "position": [
              0,
              0.08,
              0
            ],
            "rotation": [
              -1.1,
              0.42,
              -0.58
            ],
            "scale": 0.28
          },
          "bounds": {
            "footprint": [
              1,
              1
            ],
            "height": 0.72
          },
          "sourceKind": "ai_image_to_3d_glb",
          "materials": {
            "wood_dark": "#3f2618",
            "wood_mid": "#744728",
            "wood_light": "#a66f3c",
            "leather_dark": "#251812",
            "bronze_shadow": "#763d1f",
            "bronze_mid": "#c7772f",
            "bronze_light": "#efaa55",
            "bronze_edge": "#ffd486"
          },
          "fallbackPrimitives": [
            {
              "name": "octagonal_ash_handle",
              "shape": "cylinder",
              "material": "wood_mid",
              "radiusTop": 0.039,
              "radiusBottom": 0.047,
              "height": 0.79,
              "radialSegments": 8,
              "position": [
                -0.13,
                0.265,
                0
              ],
              "rotation": [
                0,
                0,
                -0.36
              ]
            },
            {
              "name": "front_handle_highlight",
              "shape": "box",
              "material": "wood_light",
              "size": [
                0.016,
                0.57,
                0.012
              ],
              "position": [
                -0.096,
                0.31,
                0.043
              ],
              "rotation": [
                0,
                0,
                -0.36
              ]
            },
            {
              "name": "rear_handle_shadow",
              "shape": "box",
              "material": "wood_dark",
              "size": [
                0.017,
                0.61,
                0.014
              ],
              "position": [
                -0.165,
                0.248,
                -0.043
              ],
              "rotation": [
                0,
                0,
                -0.36
              ]
            },
            {
              "name": "pommel_knob",
              "shape": "cylinder",
              "material": "wood_dark",
              "radiusTop": 0.053,
              "radiusBottom": 0.048,
              "height": 0.052,
              "radialSegments": 8,
              "position": [
                -0.258,
                -0.071,
                0
              ],
              "rotation": [
                0,
                0,
                -0.36
              ]
            },
            {
              "name": "lower_leather_wrap",
              "shape": "cylinder",
              "material": "leather_dark",
              "radiusTop": 0.045,
              "radiusBottom": 0.047,
              "height": 0.054,
              "radialSegments": 8,
              "position": [
                -0.213,
                0.052,
                0
              ],
              "rotation": [
                0,
                0,
                -0.36
              ]
            },
            {
              "name": "upper_leather_wrap",
              "shape": "cylinder",
              "material": "leather_dark",
              "radiusTop": 0.042,
              "radiusBottom": 0.044,
              "height": 0.058,
              "radialSegments": 8,
              "position": [
                -0.012,
                0.568,
                0
              ],
              "rotation": [
                0,
                0,
                -0.36
              ]
            },
            {
              "name": "socket_collar",
              "shape": "cylinder",
              "material": "bronze_shadow",
              "radiusTop": 0.092,
              "radiusBottom": 0.104,
              "height": 0.134,
              "radialSegments": 8,
              "position": [
                0.022,
                0.626,
                0
              ],
              "rotation": [
                0,
                0,
                -0.36
              ]
            },
            {
              "name": "socket_front_plate",
              "shape": "prism",
              "material": "bronze_mid",
              "depth": 0.104,
              "points": [
                [
                  -0.11,
                  -0.078
                ],
                [
                  0.104,
                  -0.084
                ],
                [
                  0.13,
                  0.035
                ],
                [
                  0.038,
                  0.106
                ],
                [
                  -0.118,
                  0.072
                ]
              ],
              "position": [
                0.041,
                0.632,
                0.006
              ],
              "rotation": [
                0,
                0,
                0.04
              ]
            },
            {
              "name": "left_pick_spine",
              "shape": "prism",
              "material": "bronze_mid",
              "depth": 0.078,
              "points": [
                [
                  -0.5,
                  -0.016
                ],
                [
                  -0.114,
                  -0.055
                ],
                [
                  0.002,
                  -0.007
                ],
                [
                  -0.12,
                  0.047
                ],
                [
                  -0.47,
                  0.065
                ]
              ],
              "position": [
                0.036,
                0.66,
                0
              ],
              "rotation": [
                0,
                0,
                0.055
              ]
            },
            {
              "name": "left_pick_lower_shadow",
              "shape": "prism",
              "material": "bronze_shadow",
              "depth": 0.082,
              "points": [
                [
                  -0.43,
                  -0.014
                ],
                [
                  -0.116,
                  -0.049
                ],
                [
                  -0.033,
                  -0.017
                ],
                [
                  -0.169,
                  0.009
                ],
                [
                  -0.405,
                  0.026
                ]
              ],
              "position": [
                0.018,
                0.631,
                -0.003
              ],
              "rotation": [
                0,
                0,
                0.055
              ]
            },
            {
              "name": "left_pick_bright_tip",
              "shape": "prism",
              "material": "bronze_edge",
              "depth": 0.085,
              "points": [
                [
                  -0.635,
                  0.002
                ],
                [
                  -0.48,
                  -0.03
                ],
                [
                  -0.465,
                  0.043
                ]
              ],
              "position": [
                0.033,
                0.662,
                0.002
              ],
              "rotation": [
                0,
                0,
                0.055
              ]
            },
            {
              "name": "right_chisel_blade",
              "shape": "prism",
              "material": "bronze_mid",
              "depth": 0.086,
              "points": [
                [
                  0.02,
                  -0.058
                ],
                [
                  0.35,
                  -0.071
                ],
                [
                  0.575,
                  -0.014
                ],
                [
                  0.443,
                  0.078
                ],
                [
                  0.055,
                  0.058
                ]
              ],
              "position": [
                0.032,
                0.657,
                0
              ],
              "rotation": [
                0,
                0,
                0.055
              ]
            },
            {
              "name": "right_blade_shadow_facet",
              "shape": "prism",
              "material": "bronze_shadow",
              "depth": 0.092,
              "points": [
                [
                  0.04,
                  -0.052
                ],
                [
                  0.342,
                  -0.064
                ],
                [
                  0.462,
                  -0.036
                ],
                [
                  0.304,
                  -0.001
                ],
                [
                  0.04,
                  0.021
                ]
              ],
              "position": [
                0.028,
                0.632,
                -0.004
              ],
              "rotation": [
                0,
                0,
                0.055
              ]
            },
            {
              "name": "right_chisel_edge",
              "shape": "prism",
              "material": "bronze_edge",
              "depth": 0.094,
              "points": [
                [
                  0.414,
                  -0.052
                ],
                [
                  0.588,
                  -0.014
                ],
                [
                  0.45,
                  0.068
                ],
                [
                  0.392,
                  0.032
                ],
                [
                  0.477,
                  -0.005
                ]
              ],
              "position": [
                0.032,
                0.657,
                0.002
              ],
              "rotation": [
                0,
                0,
                0.055
              ]
            },
            {
              "name": "top_hammered_ridge",
              "shape": "box",
              "material": "bronze_light",
              "size": [
                0.35,
                0.021,
                0.096
              ],
              "position": [
                0.11,
                0.711,
                0.008
              ],
              "rotation": [
                0,
                0,
                0.055
              ]
            },
            {
              "name": "front_rivet",
              "shape": "cylinder",
              "material": "bronze_edge",
              "radiusTop": 0.022,
              "radiusBottom": 0.022,
              "height": 0.018,
              "radialSegments": 10,
              "position": [
                0.041,
                0.64,
                0.061
              ],
              "rotation": [
                1.5707963268,
                0,
                0
              ]
            },
            {
              "name": "back_rivet",
              "shape": "cylinder",
              "material": "bronze_light",
              "radiusTop": 0.018,
              "radiusBottom": 0.018,
              "height": 0.016,
              "radialSegments": 10,
              "position": [
                0.026,
                0.612,
                -0.061
              ],
              "rotation": [
                1.5707963268,
                0,
                0
              ]
            }
          ]
        }
      }
    }
    ;
})();
