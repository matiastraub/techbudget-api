// Check whether a file is a directory or not
exports.isDir = (_fs, _path) => {
  try {
    const stat = _fs.lstatSync(_path);
    return stat.isDirectory();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
};
