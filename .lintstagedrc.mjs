export default {
  "**/*.js": (filenames) =>
    filenames
      .map((name) => {
        const now = new Date();
        return name.endsWith(".user.js")
          ? [
              `sed -i "s/^\\\/\\\/ @version.*/\\\/\\\/ @version      ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}/" ${name}`,
              `prettier --ignore-unknown --write ${name}`,
            ]
          : [`prettier --ignore-unknown --write ${name}`];
      })
      .flat(),
};
