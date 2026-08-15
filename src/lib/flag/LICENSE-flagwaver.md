# Third-party notice — FlagWaver

The cloth simulation in this directory (`constants.ts`, `physics.ts`, `wind.ts`,
`flag.ts`) is a TypeScript port of the physics core of **FlagWaver** by krikienoid,
<https://github.com/krikienoid/flagwaver>, used under the MIT License reproduced below.

Only the simulation was taken — the mass-spring cloth, the verlet integrator, the
wind and gravity forces, and the flag pinning. The Preact/Redux application around it,
its UI, and its art assets are not used here. The geometry construction was rewritten
against `THREE.BufferGeometry` directly rather than `ParametricGeometry`, so nothing
from `three/examples` is pulled into the bundle.

FlagWaver itself credits earlier work by [flagtest.nz](http://flagtest.nz/) and
[Joshua Koo](https://github.com/zz85), whose three.js cloth demo the integrator
derives from.

MIT is a permissive licence: we may use, modify and ship this commercially. The one
obligation is that this copyright notice travels with the code — which is what this
file is for. Do not delete it.

---

The MIT License (MIT)

Copyright (c) 2019 FlagWaver authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
