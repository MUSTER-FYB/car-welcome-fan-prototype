// ============================================================================
// 浮光跃金 · 车门迎宾云雾扇投影 After Effects 一键建工程脚本
// 用法：在 Adobe After Effects 中选择
//       「文件 (File) -> 脚本 (Scripts) -> 运行脚本文件 (Run Script File)...」
//       选择本文件 build_ae_project.jsx 即可自动搭建全部合成与关键帧。
// ============================================================================
(function () {
    app.beginUndoGroup("Build Car Welcome Fan Projection");

    var scriptFile = new File($.fileName);
    var baseDir = scriptFile.parent;
    var assetsDir = new Folder(baseDir.fsName + "/assets");

    function importFootage(fileName) {
        var f = new File(assetsDir.fsName + "/" + fileName);
        if (!f.exists) {
            return null;
        }
        var io = new ImportOptions(f);
        return app.project.importFile(io);
    }

    var whiteFan = importFootage("fan_white_layer.png");
    var goldFan  = importFootage("fan_gold_layer.png");
    var carVideo = importFootage("car_door_open.mp4");
    var carOpen  = importFootage("car_open.png");

    if (!whiteFan || !goldFan) {
        alert("未在 assets/ 目录找到 fan_white_layer.png 或 fan_gold_layer.png，请确认文件完整。");
        app.endUndoGroup();
        return;
    }

    var fps = 30;
    var totalDur = 5.4; // 2.0s 展开 + 1.0s 驻留流金 + 1.8s 缓淡消散 + 0.6s 留白
    var openEnd = 2.0;
    var holdEnd = 3.0;
    var fadeEnd = 4.8;

    // ------------------------------------------------------------------------
    // Comp 1: 01_Fan_Flat_Alpha (2560x1440 正视无透视分层扇子合成)
    // ------------------------------------------------------------------------
    var fanComp = app.project.items.addComp("01_Fan_Flat_Alpha", 2560, 1440, 1.0, totalDur, fps);

    // 1) 白扇半透明层 (52% 半透明磨砂白雾)
    var wLayer = fanComp.layers.add(whiteFan);
    wLayer.name = "01_White_Frosted_Fan_SemiTransparent";
    wLayer.property("Transform").property("Anchor Point").setValue([1262, 1263]);
    wLayer.property("Transform").property("Position").setValue([1262, 1263]);
    wLayer.property("Transform").property("Opacity").setValueAtTime(0.0, 0);
    wLayer.property("Transform").property("Opacity").setValueAtTime(0.25, 52);
    wLayer.property("Transform").property("Opacity").setValueAtTime(holdEnd, 52);
    wLayer.property("Transform").property("Opacity").setValueAtTime(fadeEnd, 0);

    // 径向擦除（以车门转轴对应的扇柄为圆心，从右侧向左侧单向扫开）
    try {
        var wWipe = wLayer.property("Effects").addProperty("ADBE Radial Wipe");
        wWipe.property("Wipe Center").setValue([1262, 1263]);
        wWipe.property("Start Angle").setValue(275);
        wWipe.property("Wipe").setValue(1); // Counterclockwise / Clockwise
        wWipe.property("Feather").setValue(18);
        wWipe.property("Transition Completion").setValueAtTime(0.0, 96);
        wWipe.property("Transition Completion").setValueAtTime(openEnd, 0);
        // 缓动
        var easeIn = new KeyframeEase(0, 65);
        var easeOut = new KeyframeEase(0, 75);
        wWipe.property("Transition Completion").setTemporalEaseAtKey(1, [easeIn], [easeOut]);
        wWipe.property("Transition Completion").setTemporalEaseAtKey(2, [easeIn], [easeOut]);
    } catch (e) {}

    // 2) 金边不透明层 (100% 实色香槟金 + CC Light Sweep 浮光跃金缓慢流动)
    var gLayer = fanComp.layers.add(goldFan);
    gLayer.name = "02_Gold_Veins_Opaque_Shimmer";
    gLayer.property("Transform").property("Anchor Point").setValue([1262, 1263]);
    gLayer.property("Transform").property("Position").setValue([1262, 1263]);
    gLayer.property("Transform").property("Opacity").setValueAtTime(0.15, 0);
    gLayer.property("Transform").property("Opacity").setValueAtTime(0.85, 100);
    gLayer.property("Transform").property("Opacity").setValueAtTime(holdEnd, 100);
    gLayer.property("Transform").property("Opacity").setValueAtTime(fadeEnd, 0);

    try {
        var gWipe = gLayer.property("Effects").addProperty("ADBE Radial Wipe");
        gWipe.property("Wipe Center").setValue([1262, 1263]);
        gWipe.property("Start Angle").setValue(275);
        gWipe.property("Wipe").setValue(1);
        gWipe.property("Feather").setValue(22);
        gWipe.property("Transition Completion").setValueAtTime(0.0, 96);
        gWipe.property("Transition Completion").setValueAtTime(openEnd, 0);
    } catch (e) {}

    // 浮光跃金扫光效果 (CC Light Sweep 循环流光 + 柔和辉光)
    try {
        var sweep = gLayer.property("Effects").addProperty("CC Light Sweep");
        sweep.property("Direction").setValue(32);
        sweep.property("Shape").setValue(2); // Smooth
        sweep.property("Width").setValue(220);
        sweep.property("Sweep Intensity").setValue(95);
        sweep.property("Edge Intensity").setValue(48);
        sweep.property("Edge Thickness").setValue(6);
        sweep.property("Light Color").setValue([1.0, 0.96, 0.80]);
        sweep.property("Center").setValueAtTime(0.0, [200, 1250]);
        sweep.property("Center").setValueAtTime(2.2, [2360, 260]);
        sweep.property("Center").setValueAtTime(4.4, [200, 1250]);
    } catch (e) {}

    try {
        var glow = gLayer.property("Effects").addProperty("ADBE Glo2");
        glow.property("Glow Threshold").setValue(68);
        glow.property("Glow Radius").setValue(36);
        glow.property("Glow Intensity").setValue(0.65);
    } catch (e) {}

    // ------------------------------------------------------------------------
    // Comp 2: 02_Car_Welcome_Garage_16x9 (1920x1080 停车场车门联动迎宾总合成)
    // ------------------------------------------------------------------------
    var mainComp = app.project.items.addComp("02_Car_Welcome_Garage_16x9", 1920, 1080, 1.0, totalDur, fps);

    // 底层：暗调地下停车场纯开门视频（前 2 秒加速到精准开门节奏，之后定格全开）
    if (carVideo) {
        var bgVid = mainComp.layers.add(carVideo);
        bgVid.name = "BG_Car_Door_Opening_Garage";
        bgVid.timeRemapEnabled = true;
        var tr = bgVid.property("Time Remap");
        var srcDur = carVideo.duration > 0.2 ? carVideo.duration - 0.04 : 4.0;
        tr.setValueAtTime(0.0, 0.0);
        tr.setValueAtTime(openEnd, srcDur);
        tr.setValueAtTime(totalDur, srcDur);
        bgVid.outPoint = totalDur;
    } else if (carOpen) {
        var bgImg = mainComp.layers.add(carOpen);
        bgImg.name = "BG_Car_Open_Still";
        bgImg.property("Transform").property("Scale").setValue([75, 75]);
    }

    // 地面投影云雾扇层（锚定车门转轴 + Corner Pin 贴合地库环氧地坪）
    var fanProj = mainComp.layers.add(fanComp);
    fanProj.name = "Projected_CloudMist_Fan_Ground";
    fanProj.blendingMode = BlendingMode.NORMAL;

    try {
        var cp = fanProj.property("Effects").addProperty("ADBE Corner Pin");
        // 与车门转轴 O(822,765)、门槛端 A(1344,940)、全开端 B(624,923) 对齐的放大地面四角坐标（无扇轴版）
        cp.property("Upper Left").setValue([1470, 1080]);
        cp.property("Upper Right").setValue([480, 1045]);
        cp.property("Lower Left").setValue([1145, 795]);
        cp.property("Lower Right").setValue([640, 748]);
    } catch (e) {}

    // 柔和环境反光辅助层 (Screen 混合模式，增强车库地坪浮光感)
    var fanGlow = fanProj.duplicate();
    fanGlow.name = "Projected_Fan_Floor_Glow_Screen";
    fanGlow.blendingMode = BlendingMode.SCREEN;
    fanGlow.property("Transform").property("Opacity").setValue(28);
    try {
        var blur = fanGlow.property("Effects").addProperty("ADBE Gaussian Blur 2");
        blur.property("Blurriness").setValue(42);
    } catch (e) {}

    // 方形投影仪光束占位层（主驾方向盘左侧方形投影仪出光点 [1031, 327]）
    var beamSolid = mainComp.layers.addSolid([0.96, 0.80, 0.48], "Projector_Beam_From_Dashboard", 1920, 1080, 1.0, totalDur);
    beamSolid.blendingMode = BlendingMode.SCREEN;
    beamSolid.property("Transform").property("Opacity").setValueAtTime(0.0, 0);
    beamSolid.property("Transform").property("Opacity").setValueAtTime(0.35, 16);
    beamSolid.property("Transform").property("Opacity").setValueAtTime(holdEnd, 16);
    beamSolid.property("Transform").property("Opacity").setValueAtTime(fadeEnd, 0);

    try {
        var mask = beamSolid.Masks.addProperty("Mask");
        var shape = new Shape();
        shape.vertices = [[1031, 327], [380, 960], [1160, 1020]];
        shape.closed = true;
        mask.property("Mask Path").setValue(shape);
        mask.property("Mask Feather").setValue([95, 95]);
    } catch (e) {}

    mainComp.openInViewer();
    app.endUndoGroup();
    alert("已成功生成两个合成：\n1. 01_Fan_Flat_Alpha（正视透明分层扇子，白扇52%半透 + 金边100%实色流光）\n2. 02_Car_Welcome_Garage_16x9（16:9 暗调地库车门联动迎宾总合成）");
})();
