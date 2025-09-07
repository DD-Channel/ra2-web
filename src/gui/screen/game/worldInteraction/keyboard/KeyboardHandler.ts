System.register(
  "gui/screen/game/worldInteraction/keyboard/KeyboardHandler",
  [
    "gui/screen/game/worldInteraction/keyboard/KeyCommandType",
    "gui/screen/game/worldInteraction/keyboard/KeyCommand",
  ],
  function (e, t) {
    "use strict";
    let KeyCommandType: any, KeyCommand: any, KeyboardHandler: any;
    t && t.id;
    return {
      setters: [
        function (e: any) {
          KeyCommandType = e;
        },
        function (e: any) {
          KeyCommand = e;
        },
      ],
      execute: function () {
        e(
          "KeyboardHandler",
          (KeyboardHandler = class KeyboardHandler {
            static anyModifierCommands = [KeyCommandType.KeyCommandType.PlanningMode];
            
            private keyBinds: any;
            private devMode: boolean;
            private commands: Map<string, any>;
            private isPaused: boolean;

            constructor(keyBinds: any, devMode: boolean) {
              this.keyBinds = keyBinds;
              this.devMode = devMode;
              this.commands = new Map();
              this.isPaused = false;
            }
            
            registerCommand(commandType: string, command: any): void {
              if (this.commands.has(commandType))
                throw new Error("Duplicate command " + commandType);
              this.commands.set(commandType, command);
            }
            
            unregisterCommand(commandType: string): void {
              this.commands.delete(commandType);
            }
            
            executeCommand(commandType: string): void {
              const command = this.commands.get(commandType);
              if (command && !this.isPaused) {
                if (typeof command === "function") {
                  command();
                } else if (command.triggerMode !== KeyCommand.TriggerMode.KeyDownUp) {
                  command.execute(command.triggerMode === KeyCommand.TriggerMode.KeyUp);
                } else {
                  command.execute(false);
                  command.execute(true);
                }
              }
            }
            
            handleKeyDown(keyEvent: KeyboardEvent): void {
              if (keyEvent.key === "Backspace") {
                keyEvent.preventDefault();
                keyEvent.stopPropagation();
              }
              if (!(
                keyEvent.repeat ||
                (["F5", "F12"].includes(keyEvent.key) && this.devMode)
              )) {
                let commandType = this.keyBinds.getCommandType(keyEvent);
                if (commandType === undefined) {
                  commandType = this.getNoModCmdType(keyEvent.keyCode);
                }
                if (commandType !== undefined) {
                  keyEvent.preventDefault();
                  keyEvent.stopPropagation();
                  const command = this.commands.get(commandType);
                  if (command && !this.isPaused) {
                    if (typeof command === "function") {
                      command();
                    } else if (command.triggerMode !== KeyCommand.TriggerMode.KeyUp) {
                      command.execute(false);
                    }
                  }
                }
              }
            }
            
            handleKeyUp(keyEvent: KeyboardEvent): void {
              if (keyEvent.key === "Alt") {
                keyEvent.preventDefault();
                keyEvent.stopPropagation();
              } else if (!this.isPaused) {
                let commandType = this.keyBinds.getCommandType(keyEvent);
                if (commandType === undefined) {
                  commandType = this.getNoModCmdType(keyEvent.keyCode);
                }
                if (commandType !== undefined) {
                  const command = this.commands.get(commandType);
                  if (command &&
                      typeof command !== "function" &&
                      (command.triggerMode === KeyCommand.TriggerMode.KeyUp ||
                       command.triggerMode === KeyCommand.TriggerMode.KeyDownUp)) {
                    command.execute(true);
                  }
                }
              }
            }
            
            getNoModCmdType(keyCode: number): string | undefined {
              const commandType = this.keyBinds.getCommandType({
                keyCode: keyCode,
                altKey: false,
                ctrlKey: false,
                shiftKey: false,
                metaKey: false,
              });
              if (commandType) {
                const command = this.commands.get(commandType);
                if (command &&
                    typeof command !== "function" &&
                    KeyboardHandler.anyModifierCommands.includes(commandType)) {
                  return commandType;
                }
              }
            }
            
            pause(): void {
              this.isPaused = true;
            }
            
            unpause(): void {
              this.isPaused = false;
            }
            
            dispose(): void {
              this.commands.clear();
            }
          }),
        );
      },
    };
  },
);
