;(function(){

import '../node_modules/grafi-formatter/src/formatter'
import '../node_modules/grafi-convolution/src/convolution'

import '../node_modules/grafi-blur/src/blur'
import '../node_modules/grafi-brightness/src/brightness'
import '../node_modules/grafi-contrast/src/contrast'
import '../node_modules/grafi-despeckle/src/despeckle'
import '../node_modules/grafi-dither/src/dither'
import '../node_modules/grafi-edge/src/edge'
import '../node_modules/grafi-grayscale/src/grayscale'
import '../node_modules/grafi-invert/src/invert'
import '../node_modules/grafi-posterize/src/posterize'
import '../node_modules/grafi-sharpen/src/sharpen'
import '../node_modules/grafi-solarize/src/solarize'
import '../node_modules/grafi-threshold/src/threshold'

  var grafi = {}
  grafi.blur = blur
  grafi.brightness = brightness
  grafi.contrast = contrast
  grafi.despeckle = despeckle
  grafi.dither = dither
  grafi.edge = edge
  grafi.grayscale = grayscale
  grafi.invert = invert
  grafi.posterize = posterize
  grafi.sharpen = sharpen
  grafi.solarize = solarize
  grafi.threshold = threshold

  if (typeof module === 'object' && module.exports) {
    module.exports = grafi
  } else {
    this.grafi = grafi
  }
}())
