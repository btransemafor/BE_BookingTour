const setAvatarFolder = (req, res, next) => {
    req.folder = 'avatars';
    next();
  };

module.exports = {setAvatarFolder}