System.register(
    "gui/screen/mainMenu/modSel/DuplicateModError",
    [],
    function (e, t) {
      "use strict";
      var i;
      t && t.id;
      return {
        setters: [],
        execute: function () {
          (i = class extends Error {}), e("DuplicateModError", i);
        },
      };
    },
  ),
  