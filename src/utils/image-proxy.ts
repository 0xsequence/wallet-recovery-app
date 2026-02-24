const IMGPROXY_URL_PREFIX = 'https://imgproxy.sequence.xyz/'
const SEQUENCE_ASSETS_URL_PREFIX = 'https://assets.sequence.info/'
const SEQUENCE_METADATA_URL_PREFIX = 'https://metadata.sequence.app/'
const SEQUENCE_DEV_METADATA_URL_PREFIX = 'https://dev-metadata.sequence.app/'

export const imgproxy = (src: string | undefined) => {
  src = replaceIpfsUrl(src)

  if (!src) {
    return undefined
  }

  // Don't rewrite urls that using the sequence metadata service
  if (
    src.startsWith(SEQUENCE_METADATA_URL_PREFIX) ||
    src.startsWith(SEQUENCE_DEV_METADATA_URL_PREFIX)
  ) {
    return src
  }

  // Don't rewrite urls that are already imgproxy urls
  if (src.startsWith(IMGPROXY_URL_PREFIX)) {
    return src
  }

  // Don't rewrite urls that are hosted on assets.sequence.info
  if (src.startsWith(SEQUENCE_ASSETS_URL_PREFIX)) {
    return src
  }

  // Don't rewrite urls that are localhost
  if (src.startsWith('http://localhost')) {
    return src
  }

  // Only rewrite urls for external assets
  if (/^https?:\/\//.test(src)) {
    return `${IMGPROXY_URL_PREFIX}${src}`
  }

  return src
}

const replaceIpfsUrl = (url: string | undefined) => {
  if (!url) {
    return undefined
  }

  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }

  return url
}
