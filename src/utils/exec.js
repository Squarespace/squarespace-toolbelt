/**
 * executes a command line array in a cross platform safe manner
 */

const os = require('os');
const execFile = require('child_process').execFileSync;

module.exports = function(cmds, options) {
  if (!cmds.join) {
    throw new Error('exec called with non-array argument');
  }
  let file;
  if (os.platform() === 'win32') {
    file = 'cmd.exe';
    cmds = ['/s', '/c'].concat(cmds);
  } else {
    file = cmds[0];
    cmds = cmds.slice(1);
  }
  return execFile(file, cmds, options);
};