# Waterfront Landscape Design - 6 Concepts
# Run via SketchUp Ruby Console: load '/path/to/waterfront_concepts.rb'
# Each concept is ~60m wide x 40m deep, arranged in a 2x3 grid with 20m gaps

module WaterfrontConcepts

  # ── helpers ──────────────────────────────────────────────────────────────────

  M = 1.0  # 1 meter in SketchUp inches = 39.3701, but we work in meters via .m

  def self.m(v); v.m; end

  def self.add_material(model, name, color)
    mats = model.materials
    mat  = mats[name] || mats.add(name)
    mat.color = color
    mat
  end

  def self.add_tag(model, name)
    tags = model.layers
    tags[name] || tags.add(name)
  end

  def self.set_tag(entities, tag)
    entities.each { |e| e.layer = tag if e.respond_to?(:layer=) }
  end

  # Draw a flat face and push/pull it to a solid box.
  # origin = [x,y,z] in meters, dims = [w,d,h] in meters
  def self.box(entities, origin, dims, material, tag)
    x, y, z   = origin.map { |v| m(v) }
    w, d, h   = dims.map   { |v| m(v) }
    pts = [ [x,y,z], [x+w,y,z], [x+w,y+d,z], [x,y+d,z] ]
    face = entities.add_face(pts)
    face.reverse! if face.normal.z < 0
    face.pushpull(m(h))
    # Material all new faces
    entities.grep(Sketchup::Face).each do |f|
      f.material = material if f.material.nil?
    end
    # We rely on caller to tag the group
  end

  # Flat plane (zero height) for water
  def self.flat_plane(entities, origin, dims, material)
    x, y, z = origin.map { |v| m(v) }
    w, d    = dims.map   { |v| m(v) }
    pts = [ [x,y,z], [x+w,y,z], [x+w,y+d,z], [x,y+d,z] ]
    face = entities.add_face(pts)
    face.reverse! if face.normal.z < 0
    face.material     = material
    face.back_material = material
  end

  # Add a named group and return its entities
  def self.make_group(parent_entities, name)
    g = parent_entities.add_group
    g.name = name
    g
  end

  # ── grid offset for concept index (0-based, 2 cols x 3 rows) ─────────────────
  # Row 0 = top (y positive), Row 1 = middle, Row 2 = bottom
  # Col 0 = left, Col 1 = center, Col 2 = right
  CELL_W   = 70   # meters per cell (model 60 + 10 gap)
  CELL_D   = 55   # meters per cell (model 40 + 15 gap)
  MODEL_W  = 60
  MODEL_D  = 40

  def self.offset(idx)
    col = idx % 3
    row = idx / 3
    [ col * CELL_W, row * CELL_D ]
  end

  # ── CONCEPT 01 – Stepped Concrete Amphitheater ───────────────────────────────
  def self.build_01(parent, mats, tags, ox, oy)
    g = make_group(parent, "Option_01_Amphitheater")
    g.layer = tags["Concrete"]
    ents = g.entities

    # Water basin  – front 10m deep
    flat_plane(ents, [ox, oy, 0], [MODEL_W, 10], mats[:water])

    # 5 concrete terraces stepping up from water (each 2m rise, 6m run)
    5.times do |i|
      tx = ox
      ty = oy + 10 + i * 6
      tz = i * 2
      sub = ents.add_group; sub.name = "terrace_#{i+1}"; sub.layer = tags["Concrete"]
      box(sub.entities, [tx, ty, tz], [MODEL_W, 6, 2], mats[:concrete], tags["Concrete"])
    end

    # Upper flat lawn at top
    sub = ents.add_group; sub.name = "upper_lawn"; sub.layer = tags["Grass"]
    box(sub.entities, [ox, oy+40, 10], [MODEL_W, 5, 0.2], mats[:grass], tags["Grass"])

    # Central pier extending into water
    sub = ents.add_group; sub.name = "pier"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox+26, oy+2, 0.3], [8, 8, 0.3], mats[:concrete], tags["Concrete"])

    # Left retaining wall
    sub = ents.add_group; sub.name = "wall_left"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox, oy+10, 0], [2, 30, 10], mats[:concrete], tags["Concrete"])

    # Right retaining wall
    sub = ents.add_group; sub.name = "wall_right"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox+MODEL_W-2, oy+10, 0], [2, 30, 10], mats[:concrete], tags["Concrete"])

    g
  end

  # ── CONCEPT 02 – Ecological Terraced Slope ───────────────────────────────────
  def self.build_02(parent, mats, tags, ox, oy)
    g = make_group(parent, "Option_02_EcoTerraces")
    g.layer = tags["Grass"]
    ents = g.entities

    # Water basin
    flat_plane(ents, [ox, oy, 0], [MODEL_W, 8], mats[:water])

    # 11 narrow grass terraces with concrete edges
    11.times do |i|
      run  = (MODEL_D - 8) / 11.0
      ty   = oy + 8 + i * run
      tz   = i * 0.6

      # grass band
      sub = ents.add_group; sub.name = "eco_terrace_#{i+1}"; sub.layer = tags["Grass"]
      box(sub.entities, [ox, ty, tz], [MODEL_W, run - 0.3, 0.15], mats[:grass], tags["Grass"])

      # concrete edge strip
      sub = ents.add_group; sub.name = "eco_edge_#{i+1}"; sub.layer = tags["Concrete"]
      box(sub.entities, [ox, ty + run - 0.3, tz], [MODEL_W, 0.3, 0.6], mats[:concrete], tags["Concrete"])
    end

    # Upper promenade
    sub = ents.add_group; sub.name = "upper_promenade"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox, oy+MODEL_D-1, 6.6], [MODEL_W, 3, 0.3], mats[:concrete], tags["Concrete"])

    g
  end

  # ── CONCEPT 03 – Parallel Waterfront Terraces ────────────────────────────────
  def self.build_03(parent, mats, tags, ox, oy)
    g = make_group(parent, "Option_03_ParallelTerraces")
    g.layer = tags["Grass"]
    ents = g.entities

    # Water
    flat_plane(ents, [ox, oy, 0], [MODEL_W, 8], mats[:water])

    terrace_data = [
      { depth: 10, height: 0,  rise: 1.5 },
      { depth: 12, height: 1.5, rise: 1.5 },
      { depth: 12, height: 3.0, rise: 1.5 },
    ]
    cum_y = oy + 8
    terrace_data.each_with_index do |td, i|
      sub = ents.add_group; sub.name = "terrace_#{i+1}"; sub.layer = tags["Grass"]
      box(sub.entities, [ox, cum_y, td[:height]], [MODEL_W, td[:depth], 0.2], mats[:grass], tags["Grass"])

      sub = ents.add_group; sub.name = "retwall_#{i+1}"; sub.layer = tags["Concrete"]
      box(sub.entities, [ox, cum_y, td[:height]], [MODEL_W, 0.4, td[:rise]], mats[:concrete], tags["Concrete"])

      cum_y += td[:depth]
    end

    # Top connecting terrace
    sub = ents.add_group; sub.name = "top_terrace"; sub.layer = tags["Grass"]
    box(sub.entities, [ox, cum_y, 4.5], [MODEL_W, 6, 0.2], mats[:grass], tags["Grass"])

    g
  end

  # ── CONCEPT 04 – Natural Sloped Waterfront ───────────────────────────────────
  def self.build_04(parent, mats, tags, ox, oy)
    g = make_group(parent, "Option_04_NaturalSlope")
    g.layer = tags["Grass"]
    ents = g.entities

    # Water
    flat_plane(ents, [ox, oy, 0], [MODEL_W, 10], mats[:water])

    # Continuous slope as a wedge: 0 at front, 5m at back
    pts = [
      m(ox),          m(oy+10), m(0),
      m(ox+MODEL_W),  m(oy+10), m(0),
      m(ox+MODEL_W),  m(oy+MODEL_D), m(5),
      m(ox),          m(oy+MODEL_D), m(5),
    ]
    face = ents.add_face(
      Geom::Point3d.new(m(ox),         m(oy+10),    0),
      Geom::Point3d.new(m(ox+MODEL_W), m(oy+10),    0),
      Geom::Point3d.new(m(ox+MODEL_W), m(oy+MODEL_D), m(5)),
      Geom::Point3d.new(m(ox),         m(oy+MODEL_D), m(5))
    )
    face.reverse! if face.normal.z < 0
    face.material      = mats[:grass]
    face.back_material = mats[:grass]
    face.layer         = tags["Grass"]

    # Diagonal path (slightly raised box crossing the slope)
    # From bottom-left to upper-right area
    sub = ents.add_group; sub.name = "diagonal_path"; sub.layer = tags["Concrete"]
    path_pts = [
      Geom::Point3d.new(m(ox+5),        m(oy+10), m(0.1)),
      Geom::Point3d.new(m(ox+5+3),      m(oy+10), m(0.1)),
      Geom::Point3d.new(m(ox+MODEL_W-5), m(oy+MODEL_D), m(5.1)),
      Geom::Point3d.new(m(ox+MODEL_W-8), m(oy+MODEL_D), m(5.1)),
    ]
    pf = sub.entities.add_face(path_pts)
    pf.reverse! if pf.normal.z < 0
    pf.pushpull(m(0.15))
    pf.material = mats[:concrete]

    g
  end

  # ── CONCEPT 05 – Elevated Promenade Wall ─────────────────────────────────────
  def self.build_05(parent, mats, tags, ox, oy)
    g = make_group(parent, "Option_05_PromenadeWall")
    g.layer = tags["Concrete"]
    ents = g.entities

    # Water
    flat_plane(ents, [ox, oy, 0], [MODEL_W, 8], mats[:water])

    # Broad plaza level 0
    sub = ents.add_group; sub.name = "lower_plaza"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox, oy+8, 0], [MODEL_W, 22, 0.3], mats[:concrete], tags["Concrete"])

    # Long retaining wall
    sub = ents.add_group; sub.name = "promenade_wall"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox, oy+29, 0], [MODEL_W, 1.5, 3.5], mats[:concrete], tags["Concrete"])

    # Elevated promenade at rear
    sub = ents.add_group; sub.name = "upper_promenade"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox, oy+30, 3.5], [MODEL_W, 8, 0.3], mats[:concrete], tags["Concrete"])

    # Grass strip beyond promenade
    sub = ents.add_group; sub.name = "top_grass"; sub.layer = tags["Grass"]
    box(sub.entities, [ox, oy+38, 3.5], [MODEL_W, MODEL_D-38, 0.2], mats[:grass], tags["Grass"])

    # Ramp left
    ramp_pts = [
      Geom::Point3d.new(m(ox+2), m(oy+25), m(0.3)),
      Geom::Point3d.new(m(ox+6), m(oy+25), m(0.3)),
      Geom::Point3d.new(m(ox+6), m(oy+30), m(3.8)),
      Geom::Point3d.new(m(ox+2), m(oy+30), m(3.8)),
    ]
    rf = ents.add_face(ramp_pts)
    rf.reverse! if rf.normal.z < 0
    rf.material = mats[:concrete]
    rf.layer    = tags["Concrete"]

    # Ramp right
    ramp_pts2 = [
      Geom::Point3d.new(m(ox+MODEL_W-6), m(oy+25), m(0.3)),
      Geom::Point3d.new(m(ox+MODEL_W-2), m(oy+25), m(0.3)),
      Geom::Point3d.new(m(ox+MODEL_W-2), m(oy+30), m(3.8)),
      Geom::Point3d.new(m(ox+MODEL_W-6), m(oy+30), m(3.8)),
    ]
    rf2 = ents.add_face(ramp_pts2)
    rf2.reverse! if rf2.normal.z < 0
    rf2.material = mats[:concrete]
    rf2.layer    = tags["Concrete"]

    g
  end

  # ── CONCEPT 06 – Geometric Waterfront Park ───────────────────────────────────
  def self.build_06(parent, mats, tags, ox, oy)
    g = make_group(parent, "Option_06_GeometricPark")
    g.layer = tags["Concrete"]
    ents = g.entities

    # Water with stepped shoreline edge
    flat_plane(ents, [ox, oy, 0], [MODEL_W, 8], mats[:water])

    # Stepped shoreline blocks
    3.times do |i|
      sub = ents.add_group; sub.name = "shore_step_#{i+1}"; sub.layer = tags["Concrete"]
      box(sub.entities, [ox + i*20, oy+7, 0], [20, 2, 0.4*(i+1)], mats[:concrete], tags["Concrete"])
    end

    # Main plaza
    sub = ents.add_group; sub.name = "main_plaza"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox, oy+9, 0], [MODEL_W, 18, 0.3], mats[:concrete], tags["Concrete"])

    # Angular pathway 1 – diagonal
    path_pts = [
      Geom::Point3d.new(m(ox),         m(oy+9),  m(0.35)),
      Geom::Point3d.new(m(ox+3),       m(oy+9),  m(0.35)),
      Geom::Point3d.new(m(ox+MODEL_W), m(oy+24), m(0.35)),
      Geom::Point3d.new(m(ox+MODEL_W-3), m(oy+24), m(0.35)),
    ]
    pf = ents.add_face(path_pts)
    pf.reverse! if pf && pf.normal.z < 0
    pf.material = mats[:concrete] if pf

    # Elevated central garden platform
    sub = ents.add_group; sub.name = "garden_platform"; sub.layer = tags["Grass"]
    box(sub.entities, [ox+15, oy+13, 0.3], [30, 10, 0.8], mats[:grass], tags["Grass"])

    # Planting voids (recessed squares) on garden platform
    [
      [ox+17, oy+14.5, 1.1],
      [ox+27, oy+14.5, 1.1],
      [ox+37, oy+14.5, 1.1],
    ].each_with_index do |(vx,vy,vz), i|
      sub = ents.add_group; sub.name = "void_#{i+1}"; sub.layer = tags["Grass"]
      box(sub.entities, [vx, vy, vz], [6, 6, 0.1], mats[:grass], tags["Grass"])
    end

    # Upper terrace
    sub = ents.add_group; sub.name = "upper_terrace"; sub.layer = tags["Concrete"]
    box(sub.entities, [ox, oy+27, 1.5], [MODEL_W, 10, 0.3], mats[:concrete], tags["Concrete"])

    # Top level
    sub = ents.add_group; sub.name = "top_level"; sub.layer = tags["Grass"]
    box(sub.entities, [ox, oy+37, 1.8], [MODEL_W, MODEL_D-37, 0.2], mats[:grass], tags["Grass"])

    g
  end

  # ── MAIN ─────────────────────────────────────────────────────────────────────
  def self.run
    model = Sketchup.active_model
    model.start_operation("Waterfront Concepts", true)

    ents = model.entities
    ents.clear! if ents.count > 0

    # Materials
    mats = {
      water:    add_material(model, "Water",     [  30, 100, 200]),
      grass:    add_material(model, "Grass",     [  80, 160,  60]),
      concrete: add_material(model, "Concrete",  [ 200, 200, 195]),
    }

    # Tags / Layers
    tags = {}
    ["Water","Grass","Concrete"].each { |n| tags[n] = add_tag(model, n) }

    # Build all 6 concepts in 2-col × 3-row grid
    builders = [
      method(:build_01), method(:build_02), method(:build_03),
      method(:build_04), method(:build_05), method(:build_06),
    ]

    builders.each_with_index do |builder, idx|
      ox_cell, oy_cell = offset(idx)
      builder.call(ents, mats, tags, ox_cell, oy_cell)
    end

    # Labels – text annotations at center of each cell
    label_data = [
      ["01 Amphitheater",    0], ["02 EcoTerraces",   1], ["03 ParallelTerraces", 2],
      ["04 NaturalSlope",    3], ["05 PromenadeWall", 4], ["06 GeometricPark",    5],
    ]
    label_data.each do |label, idx|
      ox_cell, oy_cell = offset(idx)
      pt = Geom::Point3d.new(m(ox_cell + MODEL_W/2.0), m(oy_cell - 4), m(0))
      model.entities.add_text("  #{label}", pt)
    end

    model.commit_operation

    # Zoom to fit
    Sketchup.active_model.active_view.zoom_extents

    UI.messagebox("✓ 6 Waterfront Concepts created!\n\n" \
                  "Grid: 3 cols × 2 rows\n" \
                  "Each model: 60m wide × 40m deep\n\n" \
                  "Layers: Water | Grass | Concrete\n" \
                  "Groups named Option_01 … Option_06")
  end

end

WaterfrontConcepts.run
