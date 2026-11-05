/* WaveLab — WebGL 小工具:着色器编译 / 程序封装 */
(function () {
  'use strict';
  const WL = (window.WL = window.WL || {});

  /**
   * 编译着色器程序,返回带 uniform 位置缓存的包装对象。
   * p.use() 启用;p.loc(name) 取 uniform 位置(带缓存);p.u1f/u2f/u1i 为快捷设置。
   * 带编译缓存:同一 GL 上下文内相同源码只编译一次(着色器对象可同时挂接到多个程序)。
   */
  const _shaderCache = new WeakMap(); // gl context -> Map("${type}|${src}" -> WebGLShader)
  WL.makeProgram = function (gl, vsSrc, fsSrc) {
    let cache = _shaderCache.get(gl);
    if (!cache) { cache = new Map(); _shaderCache.set(gl, cache); }

    const getShader = (type, src) => {
      const key = type + '|' + src;
      let sh = cache.get(key);
      if (sh === undefined) {
        sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(sh);
          gl.deleteShader(sh); // 编译失败也要释放,避免句柄泄漏
          cache.delete(key);
          throw new Error('着色器编译失败: ' + log);
        }
        cache.set(key, sh);
      }
      return sh;
    };

    const prog = gl.createProgram();
    const vs = getShader(gl.VERTEX_SHADER, vsSrc);
    const fs = getShader(gl.FRAGMENT_SHADER, fsSrc);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog); // 链接失败释放程序对象
      throw new Error('程序链接失败: ' + log);
    }
    // 链接完成后解挂着色器(缓存中的着色器对象仍存活,供后续程序复用)
    gl.detachShader(prog, vs);
    gl.detachShader(prog, fs);

    const uCache = new Map();
    const p = {
      handle: prog,
      use() { gl.useProgram(prog); },
      loc(name) {
        if (!uCache.has(name)) uCache.set(name, gl.getUniformLocation(prog, name));
        return uCache.get(name);
      },
      u1f(n, v) { gl.uniform1f(p.loc(n), v); },
      u2f(n, a, b) { gl.uniform2f(p.loc(n), a, b); },
      u1i(n, v) { gl.uniform1i(p.loc(n), v); },
    };
    return p;
  };

  /** 全屏三角形顶点着色器(无顶点缓冲,依赖 gl_VertexID) */
  WL.VS_QUAD = `#version 300 es
  out vec2 vUV;
  void main() {
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    vUV = p;
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`;
})();
