const fs = require('fs');
const path = require('path');

// TODO: [linux-port] linux-specific library pathing weirdness
//       revisit this -- I'm not a fan of this. I blame electron.
exports.default = async function(context) {
  if (context.electronPlatformName !== 'linux') {
    return;
  }

  const appOutDir = context.appOutDir;
  const executableName = context.packager.executableName;
  
  const originalBinary = path.join(appOutDir, executableName);
  const renamedBinary = path.join(appOutDir, `${executableName}-bin`);
  const wrapperScript = path.join(appOutDir, executableName);
  
  // Rename the original binary
  fs.renameSync(originalBinary, renamedBinary);
  
  // Create the wrapper script
  const wrapperContent = `#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
export LD_LIBRARY_PATH="$SCRIPT_DIR/resources/app.asar.unpacked/node_modules/noobs/dist/bin:\$LD_LIBRARY_PATH"
# to find obs-ffmpeg-mux
export PATH="$SCRIPT_DIR/resources/app.asar.unpacked/node_modules/noobs/dist/bin:$PATH"

# Preload system libavcodec to override Electron's limited FFmpeg (missing AAC encoder)
AVCODEC_PATH=\$(ldconfig -p | grep 'libavcodec\\.so\\.[0-9]' | sort -t. -k3 -n | tail -1 | awk '{print \$NF}')
if [ -n "\$AVCODEC_PATH" ]; then
  export LD_PRELOAD="\$AVCODEC_PATH"
fi

exec "$SCRIPT_DIR/${executableName}-bin" "$@"
`;
  
  fs.writeFileSync(wrapperScript, wrapperContent, { mode: 0o755 });
};
// TODO: [linux-port] END
