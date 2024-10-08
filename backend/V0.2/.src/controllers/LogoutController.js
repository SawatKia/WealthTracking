const DOMAIN = process.env.DOMAIN;

function logout(req, res) {
  // Clear cookies for Access and Refresh Tokens
  res.clearCookie(`_${DOMAIN}_access_token`, { httpOnly: true, secure: true, sameSite: 'Strict' });
  res.clearCookie(`_${DOMAIN}_refresh_token`, { httpOnly: true, secure: true, sameSite: 'Strict' });

  // Set req.formattedResponse instead of directly sending a response
  req.formattedResponse = formatResponse(200, { detail: 'Logged out successfully' });
}

module.exports = { logout };
