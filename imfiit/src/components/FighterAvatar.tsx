// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { SPRITES, type FighterAction } from "../sprites/config";
// import type { BodyType } from "../App";

// type Props = {
//   bodyType: BodyType;
//   action?: FighterAction;     // default idle
//   size?: number;              // canvas square size (px)
//   fps?: number;               // animation speed
//   loop?: boolean;             // whether non-idle actions loop
//   onActionEnd?: () => void;   // when a non-looping action finishes
// };

// export default function FighterAvatar({
//   bodyType,
//   action = "idle",
//   size = 300,
//   fps = 6,
//   loop = true,
//   onActionEnd,
// }: Props) {
//   const cvsRef = useRef<HTMLCanvasElement | null>(null);
//   const imgRef = useRef<HTMLImageElement | null>(null);
//   const reqRef = useRef<number | null>(null);
//   const [loaded, setLoaded] = useState(false);

//   const cfg = SPRITES[bodyType];
//   const frames = cfg.actions[action] ?? [0];

//   // Preload sprite
//   useEffect(() => {
//     const img = new Image();
//     img.src = cfg.url;
//     img.onload = () => setLoaded(true);
//     imgRef.current = img;
//     return () => {
//       setLoaded(false);
//       imgRef.current = null;
//     };
//   }, [cfg.url]);

//   // compute cell size
//   const cell = useMemo(() => {
//     if (!imgRef.current) return { w: 0, h: 0 };
//     return {
//       w: imgRef.current.width / cfg.cols,
//       h: imgRef.current.height / cfg.rows,
//     };
//   }, [loaded, cfg.cols, cfg.rows]);

//   // simple animation clock
//   useEffect(() => {
//     if (!loaded || !imgRef.current || !cvsRef.current) return;

//     const ctx = cvsRef.current.getContext("2d");
//     if (!ctx) return;

//     let frameIdx = 0;
//     let last = 0;
//     const frameDuration = 1000 / fps;

//     const draw = (ts: number) => {
//       if (!ctx || !imgRef.current) return;

//       if (ts - last >= frameDuration) {
//         last = ts;

//         // pick current frame index
//         const gridIndex = frames[Math.min(frameIdx, frames.length - 1)];
//         const sx = (gridIndex % cfg.cols) * cell.w;
//         const sy = Math.floor(gridIndex / cfg.cols) * cell.h;

//         // clear and draw
//         ctx.clearRect(0, 0, size, size);
//         // subtle idle bob: translateY few px
//         const bob =
//           action === "idle"
//             ? Math.floor((Math.sin(ts / 350) + 1) * 3) // 0..6px
//             : 0;

//         ctx.save();
//         ctx.translate(0, bob);
//         ctx.drawImage(imgRef.current, sx, sy, cell.w, cell.h, 0, 0, size, size);
//         ctx.restore();

//         // advance
//         if (frames.length > 1) frameIdx++;
//         if (frameIdx >= frames.length) {
//           if (loop || action === "idle" || action === "walk") {
//             frameIdx = 0;
//           } else {
//             // play once then end
//             onActionEnd?.();
//             return;
//           }
//         }
//       }
//       reqRef.current = requestAnimationFrame(draw);
//     };

//     reqRef.current = requestAnimationFrame(draw);
//     return () => {
//       if (reqRef.current) cancelAnimationFrame(reqRef.current);
//     };
//   }, [loaded, frames, cfg.cols, cell.w, cell.h, size, fps, loop, action, onActionEnd]);

//   return (
//     <div style={{ display: "inline-block", position: "relative" }}>
//       <canvas
//         ref={cvsRef}
//         width={size}
//         height={size}
//         style={{
//           width: size,
//           height: size,
//           borderRadius: 16,
//           background:
//             "radial-gradient(80% 80% at 50% 60%, rgba(139,92,246,.15), rgba(6,182,212,.05) 60%, transparent 80%)",
//         }}
//       />
//     </div>
//   );
// }
