# ============================================================
#  Waterfront Landscape Concepts v2  –  matches reference image
#  Run in SketchUp Ruby Console:
#    load '/Users/zixuqiao/Desktop/landarch.org/AI Architecture Awards/waterfront_concepts_v2.rb'
# ============================================================

module WaterfrontV2

  # ── Grid / Model dimensions (meters) ──────────────────────
  CELL_W = 80.0   # grid cell width
  CELL_D = 68.0   # grid cell depth
  MOD_W  = 60.0   # model footprint width
  MOD_D  = 50.0   # model footprint depth
  BASE_H = 2.5    # concrete base slab thickness
  WAT_D  = 19.0   # water zone depth from front edge

  # ── Helpers ───────────────────────────────────────────────

  def self.m(v); v.m; end   # meters → SketchUp internal units

  def self.add_mat(model, name, r, g, b)
    mt = model.materials[name] || model.materials.add(name)
    mt.color = Sketchup::Color.new(r, g, b)
    mt
  end

  def self.add_tag(model, name)
    model.layers[name] || model.layers.add(name)
  end

  # Grid offset for concept index (0-5)
  def self.offset(idx)
    [ (idx % 3) * CELL_W, (idx / 3) * CELL_D ]
  end

  # ── Solid box as a sub-group ───────────────────────────────
  # Creates a push/pulled box and sets the group material.
  def self.gbox(parent, name, x, y, z, w, d, h, mat)
    return unless h > 0.001 && w > 0.001 && d > 0.001
    sg = parent.add_group
    sg.name = name.to_s
    e = sg.entities
    f = e.add_face(
      Geom::Point3d.new(m(x),   m(y),   m(z)),
      Geom::Point3d.new(m(x+w), m(y),   m(z)),
      Geom::Point3d.new(m(x+w), m(y+d), m(z)),
      Geom::Point3d.new(m(x),   m(y+d), m(z))
    )
    f.reverse! if f.normal.z < 0
    f.pushpull m(h)
    sg.material = mat
    sg
  rescue => ex
    puts "gbox '#{name}' failed: #{ex}"
    nil
  end

  # ── Extrude a 2-D profile (YZ plane at x=ox) along +X ─────
  # yz_pairs: array of [y, z] vertices defining the profile polygon.
  # The face is extruded by `length` meters in the +X direction.
  def self.extrude_yz(parent, name, ox, yz_pairs, length, mat)
    sg = parent.add_group
    sg.name = name.to_s
    e = sg.entities
    pts = yz_pairs.map { |y, z| Geom::Point3d.new(m(ox), m(y), m(z)) }
    f = e.add_face(pts)
    return sg unless f
    # Ensure normal points in +X so pushpull goes toward +X
    f.reverse! unless f.normal.x > 0
    f.pushpull m(length)
    sg.material = mat
    sg
  rescue => ex
    puts "extrude_yz '#{name}' failed: #{ex}"
    nil
  end

  # ── Flat / sloped quad face (not a solid) ─────────────────
  # pts4: array of 4 [x,y,z] points, should be coplanar.
  def self.fquad(parent_ents, pts4, mat)
    pts = pts4.map { |p| Geom::Point3d.new(m(p[0]), m(p[1]), m(p[2])) }
    f = parent_ents.add_face(pts)
    return unless f
    f.reverse! if f.normal.z < 0 rescue nil
    f.material      = mat
    f.back_material = mat
    f
  rescue => ex
    puts "fquad failed: #{ex}"
    nil
  end

  # ==========================================================
  #  CONCEPT 01 – Stepped Concrete Amphitheater
  #  Top Left
  # ==========================================================
  def self.build_01(ents, mw, mg, mc, ox, oy)
    g = ents.add_group; g.name = "Option_01_Amphitheater"
    e = g.entities

    # Concrete base slab
    gbox(e, :base,  ox, oy, 0, MOD_W, MOD_D, BASE_H, mc)

    # Water block (raised 0.5m – gives blue front & side faces in isometric)
    gbox(e, :water, ox, oy, BASE_H, MOD_W, WAT_D, 0.5, mw)

    # 5 wide concrete steps ascending toward back
    n_steps  = 5
    avail_d  = MOD_D - WAT_D - 5.0   # leave 5 m for top grass strip
    step_d   = avail_d / n_steps.to_f # ≈ 5.2 m per step
    step_h   = 1.5                    # rise per step

    n_steps.times do |i|
      sy = oy + WAT_D + i * step_d
      sz = BASE_H + i * step_h
      gbox(e, "step_#{i+1}", ox, sy, sz, MOD_W, step_d, step_h, mc)
    end

    # Grass strip at top
    top_z = BASE_H + n_steps * step_h
    top_y = oy + WAT_D + n_steps * step_d
    gbox(e, :top_grass, ox, top_y, top_z, MOD_W, MOD_D - WAT_D - n_steps * step_d, 0.4, mg)

    g
  end

  # ==========================================================
  #  CONCEPT 02 – Ecological Terraced Slope
  #  Top Center  (many narrow grass-and-concrete bands)
  # ==========================================================
  def self.build_02(ents, mw, mg, mc, ox, oy)
    g = ents.add_group; g.name = "Option_02_EcoTerraces"
    e = g.entities

    gbox(e, :base,  ox, oy, 0, MOD_W, MOD_D, BASE_H, mc)
    gbox(e, :water, ox, oy, BASE_H, MOD_W, WAT_D, 0.5, mw)

    n_bands = 12
    land_d  = MOD_D - WAT_D
    strip   = land_d / n_bands.to_f
    rise    = 0.50   # step rise per band

    n_bands.times do |i|
      sy = oy + WAT_D + i * strip
      sz = BASE_H + i * rise

      # Grass pad (front 68 % of strip)
      gbox(e, "grass_#{i}", ox, sy, sz,
           MOD_W, strip * 0.68, 0.20, mg)

      # Concrete riser (rear 32 %, full rise height)
      gbox(e, "riser_#{i}", ox, sy + strip * 0.68, sz,
           MOD_W, strip * 0.32, rise, mc)
    end

    g
  end

  # ==========================================================
  #  CONCEPT 03 – Parallel Waterfront Terraces
  #  Top Right  (3 broad grass terraces with retaining walls)
  # ==========================================================
  def self.build_03(ents, mw, mg, mc, ox, oy)
    g = ents.add_group; g.name = "Option_03_ParallelTerraces"
    e = g.entities

    gbox(e, :base,  ox, oy, 0, MOD_W, MOD_D, BASE_H, mc)
    gbox(e, :water, ox, oy, BASE_H, MOD_W, WAT_D, 0.5, mw)

    land = MOD_D - WAT_D

    # Terrace definitions: [depth_fraction, accumulated_rise, wall_height]
    tdata = [
      { frac: 0.30, rise_cum: 0,   wall_h: 2.2 },
      { frac: 0.35, rise_cum: 2.2, wall_h: 2.2 },
      { frac: 0.35, rise_cum: 4.4, wall_h: 0   },
    ]

    cum_y = oy + WAT_D
    tdata.each_with_index do |td, i|
      td_depth = land * td[:frac]
      tz = BASE_H + td[:rise_cum]

      # Wide grass platform
      gbox(e, "terrace_#{i+1}", ox, cum_y, tz, MOD_W, td_depth, 0.3, mg)

      # Retaining wall at front edge of NEXT terrace (except last)
      if td[:wall_h] > 0
        gbox(e, "wall_#{i+1}", ox,
             cum_y + td_depth - 0.5, tz,
             MOD_W, 0.5, td[:wall_h], mc)
      end

      cum_y += td_depth
    end

    g
  end

  # ==========================================================
  #  CONCEPT 04 – Natural Sloped Waterfront
  #  Bottom Left  (smooth grass wedge, no steps, diagonal path)
  # ==========================================================
  def self.build_04(ents, mw, mg, mc, ox, oy)
    g = ents.add_group; g.name = "Option_04_NaturalSlope"
    e = g.entities

    gbox(e, :base,  ox, oy, 0, MOD_W, MOD_D, BASE_H, mc)
    gbox(e, :water, ox, oy, BASE_H, MOD_W, WAT_D + 3, 0.5, mw)

    # Grass slope as a solid wedge:
    # Triangle profile in YZ plane extruded along X.
    #   y = slope_y0 → z = BASE_H  (slope starts at water's back edge)
    #   y = slope_y1 → z = BASE_H + slope_h  (back of model, highest point)
    sy0     = oy + WAT_D + 3
    sy1     = oy + MOD_D
    slope_h = 6.5

    extrude_yz(e, :slope, ox, [
      [sy0, BASE_H],
      [sy1, BASE_H],
      [sy1, BASE_H + slope_h],
    ], MOD_W, mg)

    # Diagonal concrete path – sloped quad floating just above slope surface
    fquad(e, [
      [ox + 4,          sy0, BASE_H + 0.08],
      [ox + 8,          sy0, BASE_H + 0.08],
      [ox + MOD_W - 7,  sy1, BASE_H + slope_h + 0.08],
      [ox + MOD_W - 11, sy1, BASE_H + slope_h + 0.08],
    ], mc)

    g
  end

  # ==========================================================
  #  CONCEPT 05 – Elevated Promenade Wall
  #  Bottom Center  (flat plaza → sloped concrete wedge with grass top)
  # ==========================================================
  def self.build_05(ents, mw, mg, mc, ox, oy)
    g = ents.add_group; g.name = "Option_05_PromenadeWall"
    e = g.entities

    gbox(e, :base,  ox, oy, 0, MOD_W, MOD_D, BASE_H, mc)
    gbox(e, :water, ox, oy, BASE_H, MOD_W, WAT_D, 0.5, mw)

    # Flat concrete plaza between water and sloped wall
    plaza_d = 7.0
    gbox(e, :plaza, ox, oy + WAT_D, BASE_H, MOD_W, plaza_d, 0.4, mc)

    # Sloped wedge wall (trapezoid profile extruded along X)
    #   Front of wedge (at wy0): low  – 0.4 m tall
    #   Back  of wedge (at wy1): tall – 6.0 m
    wy0        = oy + WAT_D + plaza_d
    wall_depth = 15.0
    wy1        = wy0 + wall_depth
    h_front    = 0.4
    h_back     = 6.0

    extrude_yz(e, :promenade_wall, ox, [
      [wy0, BASE_H],
      [wy0, BASE_H + h_front],
      [wy1, BASE_H + h_back],
      [wy1, BASE_H],
    ], MOD_W, mc)

    # Grass on sloped top surface of wedge
    # 4-point sloped quad, offset 0.05 m above the concrete faces
    fquad(e, [
      [ox,       wy0, BASE_H + h_front + 0.05],
      [ox+MOD_W, wy0, BASE_H + h_front + 0.05],
      [ox+MOD_W, wy1, BASE_H + h_back  + 0.05],
      [ox,       wy1, BASE_H + h_back  + 0.05],
    ], mg)

    # Flat grass at the top behind the wall
    rem_d = MOD_D - WAT_D - plaza_d - wall_depth
    gbox(e, :top_grass, ox, wy1, BASE_H + h_back, MOD_W, rem_d, 0.3, mg) if rem_d > 0.1

    g
  end

  # ==========================================================
  #  CONCEPT 06 – Geometric Waterfront Park
  #  Bottom Right  (notched water edge, plaza, raised planters)
  # ==========================================================
  def self.build_06(ents, mw, mg, mc, ox, oy)
    g = ents.add_group; g.name = "Option_06_GeometricPark"
    e = g.entities

    gbox(e, :base, ox, oy, 0, MOD_W, MOD_D, BASE_H, mc)

    # ── Notched / stepped water shoreline ──
    # Main water rectangle (front portion)
    gbox(e, :w_main,   ox,              oy, BASE_H, MOD_W,        WAT_D - 5, 0.5, mw)

    # Left notch extends 5 m further into land
    gbox(e, :w_left,   ox,              oy + WAT_D - 5, BASE_H, MOD_W / 3.0, 5, 0.5, mw)

    # Right notch extends 5 m further into land
    gbox(e, :w_right,  ox + MOD_W*2/3.0, oy + WAT_D - 5, BASE_H, MOD_W / 3.0, 5, 0.5, mw)

    # Centre notch goes 3 m less deep than main water (land protrudes into water)
    # (concrete step visible in shoreline)
    gbox(e, :shore_step, ox + MOD_W/3.0, oy + WAT_D - 5, BASE_H,
         MOD_W / 3.0, 2, 0.5, mc)

    # ── Main concrete plaza ──
    gbox(e, :plaza, ox, oy + WAT_D, BASE_H, MOD_W, 14, 0.35, mc)

    # ── Raised central garden platform ──
    gbox(e, :garden, ox + 8, oy + WAT_D + 3, BASE_H + 0.35,
         MOD_W - 16, 9, 0.9, mg)

    # ── Square planting voids (raised boxes on garden) ──
    [9, 22, 35].each_with_index do |px_off, i|
      gbox(e, "planter_#{i+1}",
           ox + px_off, oy + WAT_D + 4, BASE_H + 1.25,
           7.5, 6.5, 0.35, mg)
    end

    # ── Upper stepped terrace ──
    gbox(e, :upper_terrace, ox, oy + WAT_D + 14, BASE_H + 1.5,
         MOD_W, 9, 0.35, mc)

    # ── Top grass band ──
    rem = MOD_D - WAT_D - 14 - 9
    gbox(e, :top_grass, ox, oy + WAT_D + 23, BASE_H + 1.85,
         MOD_W, rem, 0.2, mg) if rem > 0.1

    g
  end

  # ==========================================================
  #  MAIN – set up model and run all 6 builders
  # ==========================================================
  def self.run
    model = Sketchup.active_model
    model.start_operation("Waterfront Concepts v2", true)

    # Clear scene
    begin
      model.entities.clear!
    rescue => ex
      puts "Scene clear skipped: #{ex}"
    end

    # Materials  (Water=cyan-blue, Grass=lime-green, Concrete=warm-white)
    mw = add_mat(model, "Water",    45,  170, 195)
    mg = add_mat(model, "Grass",   100,  185,  60)
    mc = add_mat(model, "Concrete",215,  215, 208)

    # Tags / Layers
    %w[Water Grass Concrete].each { |n| add_tag(model, n) }

    # Build grid
    builders = [
      :build_01, :build_02, :build_03,
      :build_04, :build_05, :build_06,
    ]

    builders.each_with_index do |meth, idx|
      ox, oy = offset(idx)
      send(meth, model.entities, mw, mg, mc, ox, oy)
    end

    # Text labels under each concept
    labels = [
      "01  Amphitheater",  "02  EcoTerraces",      "03  ParallelTerraces",
      "04  NaturalSlope",  "05  PromenadeWall",     "06  GeometricPark",
    ]
    labels.each_with_index do |lbl, idx|
      ox, oy = offset(idx)
      pt = Geom::Point3d.new(m(ox + MOD_W / 2.0), m(oy - 5), m(0))
      model.entities.add_text("  #{lbl}", pt)
    end

    model.commit_operation
    model.active_view.zoom_extents

    UI.messagebox(
      "Waterfront Concepts v2 – complete!\n\n" \
      "6 concepts  ·  3-col × 2-row grid\n" \
      "Model size: #{MOD_W.to_i} m × #{MOD_D.to_i} m\n" \
      "Base slab:  #{BASE_H} m\n\n" \
      "Groups:  Option_01 … Option_06\n" \
      "Tags:    Water | Grass | Concrete"
    )
  end

end

WaterfrontV2.run
