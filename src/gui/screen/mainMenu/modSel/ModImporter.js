System.register(
    "gui/screen/mainMenu/modSel/ModImporter",
    [
      "util/time",
      "data/vfs/IOError",
      "engine/gameRes/importError/ArchiveExtractionError",
      "engine/gameRes/importError/InvalidArchiveError",
      "gui/screen/mainMenu/modSel/ModManager",
      "gui/screen/mainMenu/modSel/ModMeta",
      "gui/screen/mainMenu/modSel/BadModArchiveError",
      "data/IniFile",
      "gui/screen/mainMenu/modSel/DuplicateModError",
      "data/vfs/VirtualFile",
    ],
    function (e, t) {
      "use strict";
      var v, b, S, w, C, E, x, O, M, s, A;
      t && t.id;
      return {
        setters: [
          function (e) {
            v = e;
          },
          function (e) {
            b = e;
          },
          function (e) {
            S = e;
          },
          function (e) {
            w = e;
          },
          function (e) {
            C = e;
          },
          function (e) {
            E = e;
          },
          function (e) {
            x = e;
          },
          function (e) {
            O = e;
          },
          function (e) {
            M = e;
          },
          function (e) {
            s = e;
          },
        ],
        execute: function () {
          e(
            "ModImporter",
            (A = class A {
              constructor(e, t, i) {
                (this.strings = e),
                  (this.messageBoxApi = t),
                  (this.storage = i);
              }
              async import(e, s, a, n) {
                let o = this.strings,
                  i,
                  r,
                  l;
                try {
                  let e = await SystemJS.import("7z-wasm");
                  l = await e({
                    quit: (e, t) => {
                      (i = e), (r = t);
                    },
                  });
                } catch (e) {
                  if (e instanceof WebAssembly.RuntimeError)
                    throw new b.IOError("Couldn't load 7z-wasm", { cause: e });
                  throw e;
                }
                n(o.get("ts:import_loading_archive")), l.FS.chdir("/tmp");
                var t = e.name;
                try {
                  var c = await e.arrayBuffer(),
                    h = l.FS.open(t, "w+");
                  l.FS.write(h, new Uint8Array(c), 0, c.byteLength, 0, !0),
                    l.FS.close(h);
                } catch (e) {
                  if (e instanceof DOMException)
                    throw new b.IOError(
                      `File "${t}" could not be read (${e.name})`,
                      { cause: e },
                    );
                  throw e;
                }
                if (
                  (n(o.get("ts:import_extracting_archive")),
                  await v.sleep(100),
                  l.callMain(["x", "-ssc-", "-x!*/", t, "*.*"]),
                  i)
                ) {
                  if (1 !== i)
                    throw new w.InvalidArchiveError(
                      "7-Zip exited with code " + i,
                      { cause: r },
                    );
                  if (r?.message?.match(/out of memory|allocation/i))
                    throw new RangeError("Out of memory", { cause: r });
                  throw new S.ArchiveExtractionError(
                    "Archive extraction failed with code " + i,
                    { cause: r },
                  );
                }
                l.FS.unlink(t);
                let u = l.FS.lookupPath(l.FS.cwd())["node"],
                  d = Object.keys(u.contents),
                  g = new E.ModMeta();
                var p,
                  h = () => {
                    ({ node: u } = l.FS.lookupPath(l.FS.cwd())),
                      (d = Object.keys(u.contents));
                    for (var e of d) l.FS.unlink(e);
                  };
                let m = 0;
                for (p of d) m += l.FS.stat(p).size;
                if (this.storage?.estimate) {
                  t = await this.storage.estimate().catch((e) => {
                    console.warn("Couldn't get storage estimate", [e]);
                  });
                  if (t?.quota && t.usage) {
                    t = t.quota - t.usage;
                    if (t < m + 1048576)
                      return (
                        await this.messageBoxApi.alert(
                          o.get(
                            "GUI:InstallModStorageFull",
                            t / 1024 / 1024,
                            m / 1024 / 1024,
                          ),
                          o.get("GUI:OK"),
                        ),
                        void h()
                      );
                  }
                }
                try {
                  let t = await s.listEntries(),
                    i;
                  if (d.includes(C.ModManager.modMetaFileName)) {
                    let e = this.readFileFromEmFs(
                      l.FS,
                      C.ModManager.modMetaFileName,
                    );
                    try {
                      g.fromIniFile(new O.IniFile(e.readAsString("utf-8")));
                    } catch (e) {
                      throw new x.BadModArchiveError(
                        "Mod meta file is invalid",
                      );
                    }
                    if (
                      ((i = g.id), !a && t.find((e) => e.toLowerCase() === i))
                    )
                      throw new M.DuplicateModError(
                        `A mod with the id "${g.id}" already exists`,
                      );
                  } else {
                    if (
                      !d.some((e) =>
                        A.modFileExtensions.includes(
                          u.contents[e].name.toLowerCase().split(".").pop(),
                        ),
                      )
                    )
                      throw new x.BadModArchiveError(
                        "Archive doesn't contain a valid mod",
                      );
                    if (
                      !(await this.messageBoxApi.confirm(
                        this.strings.get("GUI:ImportModUnsupportedWarn"),
                        this.strings.get("GUI:Continue"),
                        this.strings.get("GUI:Cancel"),
                      ))
                    )
                      return void h();
                    if (((i = await this.promptFolderName(t)), !i))
                      return void h();
                    (g.id = i), (g.name = i);
                  }
                  let r = await s.getOrCreateDirectory(i);
                  for await (var f of r.getFileHandles())
                    await r.deleteFile(f.name);
                  for (var y of d) {
                    n(o.get("ts:import_importing", y));
                    try {
                      var T = this.readFileFromEmFs(l.FS, y);
                      await r.writeFile(T);
                    } catch (e) {
                      throw (await s.deleteDirectory(r.name, !0), e);
                    } finally {
                      l.FS.unlink(y);
                    }
                  }
                } finally {
                  h();
                }
                return g;
              }
              async promptFolderName(e) {
                let t = this.strings,
                  i;
                for (;;) {
                  if (
                    ((i = await this.messageBoxApi.prompt(
                      t.get("GUI:ImportModFolderPrompt"),
                      t.get("GUI:Ok"),
                      t.get("GUI:Cancel"),
                    )),
                    !i)
                  )
                    return;
                  if (i.match(C.ModManager.modIdRegex)) {
                    if (!e.some((e) => e.toLowerCase() === i)) break;
                    await this.messageBoxApi.alert(
                      t.get("GUI:ImportModFolderExists"),
                      t.get("GUI:Ok"),
                    );
                  } else
                    await this.messageBoxApi.alert(
                      t.get("GUI:ImportModFolderBadName"),
                      t.get("GUI:Ok"),
                    );
                }
                return i;
              }
              readFileFromEmFs(e, t) {
                e.chmod(t, 448);
                let i = e.lookupPath(t)["node"];
                var r = i.contents.subarray(0, i.usedBytes);
                return s.VirtualFile.fromBytes(
                  r,
                  t.slice(t.lastIndexOf("/") + 1),
                );
              }
            }),
          ),
            (A.modFileExtensions = ["ini", "mix"]);
        },
      };
    },
  ),
  