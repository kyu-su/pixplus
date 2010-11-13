#!/bin/sh
SIGN_ID='crckyl-pixplus'
#C14N=http://www.w3.org/2006/12/xml-c14n11
C14N=http://www.w3.org/TR/2001/REC-xml-c14n-20010315
SIGN_ROOT=sign
SIGN_CRT=$SIGN_ROOT/sign.crt
SIGN_KEY=$SIGN_ROOT/sign.key
SIGN_PASS=$SIGN_ROOT/password
SIGN_TMPL=$SIGN_ROOT/template.xml
SIGN_UID=`date | sha256sum | awk '{print $1}'`
X509CERT=`grep -v '^-' $SIGN_CRT | sed -e 's/^/    /'`

hash_postproc() {
  awk '{print $1}' | tr -d '\n' | perl -e 'print pack("H*",<>)' | base64
}
remove_nl() {
  awk 'NR>1{print A}{A=$0}END{printf "%s",A}'
}

cat > $SIGN_TMPL <<EOS
<?xml version="1.0" encoding="UTF-8"?>
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#" Id="$SIGN_ID">
  <SignedInfo>
    <CanonicalizationMethod Algorithm="$C14N" />
    <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
EOS
for file in $@; do
  cat >> $SIGN_TMPL <<EOS
    <Reference URI="$file">
      <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
      <DigestValue />
    </Reference>
EOS
done
cat >> $SIGN_TMPL <<EOS
    <Reference URI="#prop">
      <Transforms><Transform Algorithm="$C14N" /></Transforms>
      <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
      <DigestValue />
    </Reference>
  </SignedInfo>
EOS
cat >> $SIGN_TMPL <<EOS
  <SignatureValue />
  <KeyInfo><X509Data><X509Certificate>
$X509CERT
  </X509Certificate></X509Data></KeyInfo>
EOS
cat >> $SIGN_TMPL <<EOS
  <Object Id="prop">
    <SignatureProperties xmlns:dsp="http://www.w3.org/2009/xmldsig-properties">
      <SignatureProperty Id="profile" Target="#$SIGN_ID">
        <dsp:Profile URI="http://www.w3.org/ns/widgets-digsig#profile" />
      </SignatureProperty>
      <SignatureProperty Id="role" Target="#$SIGN_ID">
        <dsp:Role URI="http://www.w3.org/ns/widgets-digsig#role-author" />
      </SignatureProperty>
      <SignatureProperty Id="identifier" Target="#$SIGN_ID">
        <dsp:Identifier>$SIGN_UID</dsp:Identifier>
      </SignatureProperty>
    </SignatureProperties>
  </Object>
EOS
echo '</Signature>' >> $SIGN_TMPL
xmlsec1 sign --privkey-pem $SIGN_KEY --pwd `cat $SIGN_PASS` $SIGN_TMPL
