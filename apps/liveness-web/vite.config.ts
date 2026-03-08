import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  //  核心修复：强制 Vite 对老旧的 CommonJS 包进行兼容处理
  optimizeDeps: {
    include: ["@aws-amplify/ui-react-liveness", "@mediapipe/face_detection"],
    // 强制包装一下，无中生有给它造一个 default 导出，完美解决报错
    needsInterop: ["@mediapipe/face_detection"],
  },
  // 为了防止生产环境 build 的时候也报这个错，加上这层保险
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
