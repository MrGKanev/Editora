// electron-squirrel-startup ships no types. It exports a single boolean that is
// true when the process was launched by a Squirrel install/update event.
declare module "electron-squirrel-startup" {
  const squirrelStartup: boolean;
  export default squirrelStartup;
}
