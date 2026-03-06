import argparse
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv
    if "--" not in argv:
        raise RuntimeError("Missing -- argument separator")
    user_args = argv[argv.index("--") + 1 :]

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--size", type=int, default=256)
    return parser.parse_args(user_args)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def import_model(path):
    ext = os.path.splitext(path)[1].lower()

    if ext == ".obj":
        if hasattr(bpy.ops.wm, "obj_import"):
            bpy.ops.wm.obj_import(filepath=path)
        else:
            bpy.ops.import_scene.obj(filepath=path)
    elif ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    else:
        raise RuntimeError(f"Unsupported model extension: {ext}")


def setup_lighting():
    key_light = bpy.data.lights.new(name="Key", type="AREA")
    key_light.energy = 800
    key_obj = bpy.data.objects.new(name="Key", object_data=key_light)
    key_obj.location = (2.5, -2.5, 3.5)
    bpy.context.collection.objects.link(key_obj)

    fill_light = bpy.data.lights.new(name="Fill", type="AREA")
    fill_light.energy = 300
    fill_obj = bpy.data.objects.new(name="Fill", object_data=fill_light)
    fill_obj.location = (-2.0, -1.5, 2.0)
    bpy.context.collection.objects.link(fill_obj)


def frame_objects_and_camera():
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("No mesh objects found after import")

    for obj in meshes:
        obj.select_set(True)

    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")

    min_corner = Vector((float("inf"), float("inf"), float("inf")))
    max_corner = Vector((float("-inf"), float("-inf"), float("-inf")))

    for obj in meshes:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            min_corner.x = min(min_corner.x, world.x)
            min_corner.y = min(min_corner.y, world.y)
            min_corner.z = min(min_corner.z, world.z)
            max_corner.x = max(max_corner.x, world.x)
            max_corner.y = max(max_corner.y, world.y)
            max_corner.z = max(max_corner.z, world.z)

    center = (min_corner + max_corner) * 0.5
    size = max(max_corner.x - min_corner.x, max_corner.y - min_corner.y, max_corner.z - min_corner.z)
    distance = max(1.5, size * 2.2)

    cam_data = bpy.data.cameras.new(name="Camera")
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    cam_obj.location = (center.x + distance, center.y - distance, center.z + distance * 0.7)
    bpy.context.collection.objects.link(cam_obj)

    track = bpy.data.objects.new("Target", None)
    track.location = center
    bpy.context.collection.objects.link(track)

    constraint = cam_obj.constraints.new(type="TRACK_TO")
    constraint.target = track
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    bpy.context.scene.camera = cam_obj


def configure_render(output_path, size):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.filepath = output_path


def main():
    args = parse_args()

    if args.size < 64 or args.size > 2048:
        raise RuntimeError("--size must be between 64 and 2048")

    clear_scene()
    import_model(args.input)
    setup_lighting()
    frame_objects_and_camera()
    configure_render(args.output, args.size)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
