;(function () {
  /**
    ## ImageData object constructor
    Every return from grafi method is formatted to an ImageData object.
    This constructor is used when `window` is not available.
    (for example you are using grafi in node)
   */
  function GrafiImageData (pixelData, width, height) {
    this.width = width
    this.height = height
    this.data = pixelData
  }

  /**
    ## Color Depth Checker
    To maintain simplicity of code, grafi only accepts ImageData in RGBA
    Length of pixelData must be 4 times as much as available pixels (width * height).
   */
  function checkColorDepth (dataset, width, height) {
    var colorDepth
    if (dataset.width && dataset.height) {
      // When ImageData object was passed as dataset
      colorDepth = dataset.data.length / (dataset.width * dataset.height)
    } else {
      // When just an array was passed as dataset
      colorDepth = dataset.length / (width * height)
    }

    if (colorDepth !== 4) {
      throw new Error('data and size of the image does now match')
    }
  }

  /**
    ## formatter
    Internal function used to format pixel data into ImageData object

    ### Parameters
      - pixelData `Uint8ClampedArray`: pixel representation of the image
      - width `Number`: width of the image
      - hight `Number`: height of the image

    ### Example
        formatter(new Uint8ClampedArray[400], 10, 10)
        // ImageData { data: Uint8ClampedArray[400], width: 10, height: 10, }
   */
  function formatter (pixelData, width, height) {
    // check the size of data matches
    checkColorDepth(pixelData, width, height)

    if (!(pixelData instanceof Uint8ClampedArray)) {
      throw new Error('pixel data passed is not an Uint8ClampedArray')
    }

    // If window is available create ImageData using browser API,
    // otherwise call ImageData constructor
    if (typeof window === 'object') {
      return new window.ImageData(pixelData, width, height)
    }
    return new GrafiImageData(pixelData, width, height)
  }
  /**
    ## convolution method
    Internal method to apply convolution filter
    !!! this method does not return ImageObject

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function convolution (imgData, option) {
    // check options object & set default variables
    option = option || {}
    option.monochrome = option.monochrome || false
    option.divisor = option.divisor || 1
    option.median = option.median || false
    if (!option.filter || !option.radius) {
      throw new Error('Required options missing. filter : ' + option.filter + ', radius: ' + option.radius)
    }

    // Check length of data & avilable pixel size to make sure data is good data
    var pixelSize = imgData.width * imgData.height
    var dataLength = imgData.data.length
    var colorDepth = dataLength / pixelSize
    if (colorDepth !== 4 && colorDepth !== 1) {
      throw new Error('ImageObject has incorrect color depth')
    }
    var newPixelData = new Uint8ClampedArray(pixelSize * (option.monochrome || 4))

    var height = imgData.height
    var width = imgData.width
    var f = option.filter
    var r = option.radius
    var ch, y, x, fy, fx, arr, s, result, i

    // do convolution math for each channel
    for (ch = 0; ch < colorDepth; ch++) {
      for (y = r; y < height - r; y++) {
        for (x = r; x < width - r; x++) {
          i = (x + y * width) * colorDepth + ch
          if (ch === 3) {
            if (colorDepth === 4 && option.monochrome) {
              newPixelData[x + y * width] = imgData.data[x + y * width]
              continue
            }
            newPixelData[i] = imgData.data[i]
            continue
          }

          arr = []
          for (fy = -r; fy < r * 2; fy++) {
            for (fx = -r; fx < r * 2; fx++) {
              arr.push(imgData.data[(x + fx + (y + fy) * width) * colorDepth + ch])
            }
          }

          result = option.median
            ? arr.sort()[Math.floor(arr.length / 2)]
            : arr.map(function (data, index) { return data * f[index]}).reduce(function (p, n) { return p + n }) / option.divisor

          if (colorDepth === 4 && option.monochrome) {
            newPixelData[(x + y * width)] = result
            continue
          }
          newPixelData[i] = result
        }
      }

      for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
          if (colorDepth === 4 && option.monochrome) {
            // copy colors from top & bottom rows
            if (y < r || y > height - (r * 2)) {
              newPixelData[x + y * width] = imgData.data[x + y * width]
              continue
            }
            // copy colors from left and write columns
            if (x < r || x > width - (r * 2)) {
              newPixelData[x + y * width] = imgData.data[x + y * width]
            }
            continue
          }

          i = (x + y * width) * colorDepth + ch
          // copy colors from top & bottom rows
          if (y < r || y > height - (r * 2)) {
            newPixelData[i] = imgData.data[i]
            continue
          }
          // copy colors from left and write columns
          if (x < r || x > width - (r * 2)) {
            newPixelData[i] = imgData.data[i]
          }
        }
      }
    }
    return formatter(newPixelData, imgData.width, imgData.height)
  }

  /**
    ## blur method
    Brief description

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function blur (imgData, option) {
    // check options object & set default variables
    option = option || {}
    option.monochrome = option.monochrome || false
    option.type = option.type || 'gaussian'

    var types = {
      average: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      gaussian: [1, 2, 1, 2, 4, 2, 1, 2, 1]
    }
    if (!types[option.type]) {
      throw new Error('Could not find type of filter requested')
    }
    var f = types[option.type]
    return convolution(imgData, {
      filter: f,
      divisor: f.reduce(function (p, n) { return p + n }),
      radius: 1,
      monochrome: option.monochrome
    })
  }
  /**
    ## brightness method
    Adjust brightness of an image based on level passed

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object
        - level `Number` : brightness level

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10 }
        // brighten image
        grafi.brightness(input, {level: 10})
        // darken image
        grafi.brightness(input, {level: -10})
   */
  function brightness (imgData, option) {
    // sanitary check for input data
    checkColorDepth(imgData)

    // check options object
    option = option || {}
    option.level = option.level || 0

    var pixelSize = imgData.width * imgData.height
    var level = option.level

    var newPixelData = new Uint8ClampedArray(pixelSize * 4)
    var pixel, index
    for (pixel = 0; pixel < pixelSize; pixel++) {
      index = pixel * 4
      newPixelData[index] = imgData.data[index] + level
      newPixelData[index + 1] = imgData.data[index + 1] + level
      newPixelData[index + 2] = imgData.data[index + 2] + level
      newPixelData[index + 3] = imgData.data[index + 3]
    }

    return formatter(newPixelData, imgData.width, imgData.height)
  }

  /**
    ## contrast method
    Brief description

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function contrast (imgData, option) {
    // check options object
    option = option || {}
    option.monochrome = option.monochrome || false
    option.level = option.level || 1

    var pixelSize = imgData.width * imgData.height
    var dataLength = imgData.data.length
    var colorDepth = dataLength / pixelSize
    var level = option.level

    if (colorDepth !== 4 && colorDepth !== 1) {
      throw new Error('ImageObject has incorrect color depth')
    }

    var newPixelData = new Uint8ClampedArray(pixelSize * (option.monochrome || 4))
    var p, _i, _data
    for (p = 0; p < pixelSize; p++) {
      if (colorDepth === 1) {
        _data = (imgData.data[p] - 128) * level + 128

        // case 1. input is 1 channel and output should be 1 channel (monochrome)
        if (option.monochrome) {
          newPixelData[p] = _data
          continue
        }

        // case 2. input is 1 channel but output should be RGBA
        newPixelData[_i] = _data
        newPixelData[_i + 1] = _data
        newPixelData[_i + 2] = _data
        newPixelData[_i + 3] = 255
        continue
      }

      // case 3. input is RGBA  and output should also be RGBA
      _i = p * 4
      newPixelData[_i] = (imgData.data[_i] - 128) * level + 128
      newPixelData[_i + 1] = (imgData.data[_i + 1] - 128) * level + 128
      newPixelData[_i + 2] = (imgData.data[_i + 2] - 128) * level + 128
      newPixelData[_i + 3] = imgData.data[_i + 3]
    }

    return formatter(newPixelData, imgData.width, imgData.height)
  }
  /**
    ## despeckle method
    Brief description

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function despeckle (imgData, option) {
    // check options object & set default variables
    option = option || {}
    option.monochrome = option.monochrome || false
    option.type = option.type || 'median'

    var types = {
      median: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      mean: [1, 1, 1, 1, 1, 1, 1, 1, 1]
    }
    if (!types[option.type]) {
      throw new Error('Could not find type of filter requested')
    }
    var f = types[option.type]
    return convolution(imgData, {
      filter: f,
      divisor: f.reduce(function (p, n) { return p + n }),
      radius: 1,
      monochrome: option.monochrome,
      median: (option.type === 'median')
    })
  }
  /**
    ## dither method
    Brief description

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function dither (imgData, option) {
    // Your code here :) !
    // What is this `export default` thing?
    // grafi uses rollup (ES6 module bundler) to build distribution file
    // see https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/export
    // for more about export

    // every return from grafi methods are ImageData,
    // internal function `formatter()` will take care of this
    return formatter(_pixelData_, _width_, _height_)
  }
  /**
    ## edge method
    Brief description

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function edge (imgData, option) {
    // check options object & set default variables
    option = option || {}
    option.monochrome = option.monochrome || false
    option.level = option.level || 1
    option.type = option.type || 'laplacian'

    // Check length of data & avilable pixel size to make sure data is good data
    var pixelSize = imgData.width * imgData.height
    var dataLength = imgData.data.length
    var colorDepth = dataLength / pixelSize
    if (colorDepth !== 4 && colorDepth !== 1) {
      throw new Error('ImageObject has incorrect color depth')
    }

    if (colorDepth === 4) {
      imgData = grayscale(imgData)
    }

    var types = {
      laplacian: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
    }
    if (!types[option.type]) {
      throw new Error('Could not find type of filter requested')
    }

    var f = types[option.type]
    return convolution(imgData, {
      filter: f,
      divisor: f.length / option.level,
      radius: 1,
      monochrome: option.monochrome
    })
  }
  /**
    ## grayscale method
    Grayscale color of an given image.
    If no option is passed, it defaults to { mode: 'luma', monochrome: false }

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object
          - mode `String` : grayscaling mode, 'luma', 'simple', or 'average'
          - channel `String` : color channel to use when in simple mode, 'r', 'g', or 'b'

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10 }
        // grayscale based on average of RGB colors
        grafi.grayscale(input, {mode: 'average'})
        // grayscale by repeating value of specified color channel across all channel
        grafi.grayscale(input, {mode: 'simple', channel: 'r'})
   */
  function grayscale (imgData, option) {
    // sanitary check for input data
    checkColorDepth(imgData)

    // set check options object & set default options if necessary
    option = option || {}
    option.mode = option.mode || 'luma'
    option.channel = option.channel || 'g'

    // different grayscale methods
    var mode = {
      'luma': function (r, g, b) {
        return 0.299 * r + 0.587 * g + 0.114 * b
      },
      'simple': function (r, g, b, a, c) {
        var ref = {r: 0, g: 1, b: 2}
        return arguments[ref[c]]
      },
      'average': function (r, g, b) {
        return (r + g + b) / 3
      }
    }

    var pixelSize = imgData.width * imgData.height
    var newPixelData = new Uint8ClampedArray(pixelSize * 4)
    var i, _grayscaled, _index

    // loop through pixel size, extract r, g, b values & calculate grayscaled value
    for (i = 0; i < pixelSize; i++) {
      _index = i * 4
      _grayscaled = mode[option.mode](imgData.data[_index], imgData.data[_index + 1], imgData.data[_index + 2], imgData.data[_index + 3], option.channel)
      newPixelData[_index] = _grayscaled
      newPixelData[_index + 1] = _grayscaled
      newPixelData[_index + 2] = _grayscaled
      newPixelData[_index + 3] = imgData.data[_index + 3]
    }
    return formatter(newPixelData, imgData.width, imgData.height)
  }
  /**
    ## invert method
    inverts color of an given image

    ### Parameters
      - imageData `Object`: ImageData object

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10, }
        grafi.invert(input)
   */
  function invert (imgData) {
    checkColorDepth(imgData)
    var dataLength = imgData.data.length
    var newPixeldata = new Uint8ClampedArray(dataLength)
    var i
    for (i = 0; i < dataLength; i++) {
      // the image has Alpha channel, skip invert every 4th one
      if ((i + 1) % 4 === 0) {
        newPixeldata[i] = imgData.data[i]
        continue
      }
      newPixeldata[i] = 255 - imgData.data[i]
    }
    return formatter(newPixeldata, imgData.width, imgData.height)
  }
  /**
    ## posterize method
    posterize given image

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object
          - level `Number` : posterize level, from 2 - 256

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10 }
        // posterlize in 4 levels
        grafi.posterize(input, {level: 4})
   */
  function posterize (imgData, option) {
    // make sure data is good data
    checkColorDepth(imgData)

    // check options object & set default variables
    option = option || {}
    option.level = option.level || 4

    var pixelSize = imgData.width * imgData.height
    var newPixelData = new Uint8ClampedArray(pixelSize * 4)

    var lookupTable = new Uint8Array(256)
    var colorSize = 256 / (option.level - 1)
    var stepSize = 256 / option.level
    var level, step, levelindex, pixel, index

    for (level = 0; level < option.level; level++) {
      for (step = 0; step < stepSize; step++) {
        levelindex = Math.round(level * stepSize + step)
        if (level === option.level - 1) {
          lookupTable[levelindex] = 255
          continue
        }
        lookupTable[levelindex] = level * colorSize
      }
    }

    for (pixel = 0; pixel < pixelSize; pixel++) {
      index = pixel * 4
      newPixelData[index] = lookupTable[imgData.data[index]]
      newPixelData[index + 1] = lookupTable[imgData.data[index + 1]]
      newPixelData[index + 2] = lookupTable[imgData.data[index + 2]]
      newPixelData[index + 3] = imgData.data[index + 3]
    }

    return formatter(newPixelData, imgData.width, imgData.height)
  }
  /**
    ## sharpen method
    Brief description

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function sharpen (imgData, option) {
    // check options object & set default variables
    option = option || {}
    option.monochrome = option.monochrome || false
    option.level = option.level || 1

    var filter = [0, -option.level, 0,
      -option.level, option.level * 4 + 1, -option.level, 0,
      -option.level, 0]

    return convolution(imgData, {filter: filter, radius: 1, monochrome: option.monochrome})
  }
  /**
    ## solarize method
    Brief description

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object

    ### Example
        //code sample goes here
   */
  function solarize (imgData, option) {
    // check options object & set default variables
    option = option || {}
    option.monochrome = option.monochrome || false

    // Check length of data & avilable pixel size to make sure data is good data
    var pixelSize = imgData.width * imgData.height
    var dataLength = imgData.data.length
    var colorDepth = dataLength / pixelSize
    if (colorDepth !== 4 && colorDepth !== 1) {
      throw new Error('ImageObject has incorrect color depth')
    }

    var newPixelData = new Uint8ClampedArray(pixelSize * (option.monochrome || 4))

    var lookupTable = new Uint8Array(256)
    var colorSize = 256 / (option.level - 1) // 23
    var stepSize = 256 / 3
    var l, _li, r, p, _i, _data

    for (l = 0; l < 3; l++) {
      for (s = 0; s < stepSize; s++) {
        _li = Math.round(l * stepSize + s)
        if ((l + 1) % 2) {
          if (l + 1 >= stepSize) {
            lookupTable[_li] = 255
            continue
          }
          lookupTable[_li] = s * (256 / stepSize)
          console.log(s * (256 / stepSize))
          continue
        }

        lookupTable[_li] = 255 - (s * (256 / stepSize))
      }
    }

    console.log(lookupTable)

    for (p = 0; p < pixelSize; p++) {
      if (colorDepth === 1) {
        _data = lookupTable[imgData.data[p]]
        // case 1. input is 1 channel and output should be 1 channel (monochrome)
        if (option.monochrome) {
          newPixelData[p] = _data
          continue
        }
        // case 2. input is 1 channel but output should be RGBA
        newPixelData[_i] = _data
        newPixelData[_i + 1] = _data
        newPixelData[_i + 2] = _data
        newPixelData[_i + 3] = 255
        continue
      }

      // case 3. input is RGBA  and output should also be RGBA
      _i = p * 4
      newPixelData[_i] = lookupTable[imgData.data[_i]]
      newPixelData[_i + 1] = lookupTable[imgData.data[_i + 1]]
      newPixelData[_i + 2] = lookupTable[imgData.data[_i + 2]]
      newPixelData[_i + 3] = imgData.data[_i + 3]
    }

    return formatter(newPixelData, imgData.width, imgData.height)
  }
  /**
    ## threshold method
    Threshold an image on the level passed as option

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object
          - level `Number` : threshold level, from 0 to 255
          - grayscaled `Boolean` : input imageData is grayscaled or not

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10 }
        // threshold at level 200
        grafi.threshold(input, {level: 200})
        // if input image is already grayscaled, pass grayscaeled flag to bypass redundant grayscaling
        grafi.threshold(input, {level: 200, grayscaled: true})
   */
  function threshold (imgData, option) {
    // make sure data is good data
    checkColorDepth(imgData)

    // set check options object & set default options if necessary
    option = option || {}
    option.level = option.level || 127
    option.grayscaled = option.grayscaled || false

    var pixelSize = imgData.width * imgData.height
    var grayscaledData = imgData.data
    if (!option.grayscaled) {
      grayscaledData = grayscale(imgData).data
    }
    var newPixelData = new Uint8ClampedArray(pixelSize * 4)
    var lookupTable = new Uint8Array(256)
    var i, pixel, index
    for (i = option.level; i < 256; i++) {
      lookupTable[i] = 255
    }

    for (pixel = 0; pixel < pixelSize; pixel++) {
      index = pixel * 4
      newPixelData[index] = lookupTable[grayscaledData[index]]
      newPixelData[index + 1] = lookupTable[grayscaledData[index + 1]]
      newPixelData[index + 2] = lookupTable[grayscaledData[index + 2]]
      newPixelData[index + 3] = imgData.data[index + 3]
    }
    return formatter(newPixelData, imgData.width, imgData.height)
  }
  /**
    ## pseudocolor method
    Gibe grayscaled image rainbow pseudocolor
    TODO: support different pseudocolor scheme

    ### Parameters
      - imageData `Object`: ImageData object
      - option `Object` : Option object
          - grayscaled `Boolean` : input imageData is grayscaled or not

    ### Example
        var input = { data: Uint8ClampedArray[400], width: 10, height: 10 }
        // turn image into pseudocolor
        grafi.pseudocolor(input)
        // if input image is already grayscaled, pass grayscaeled flag to bypass redundant grayscaling
        grafi.pseudocolor(input, {grayscaled: true})
   */
  function pseudocolor (imgData, option) {
    // sanitary check for input data
    checkColorDepth(imgData)

    // check options object & set default variables
    option = option || {}
    option.grayscaled = option.grayscaled || false

    var pixelSize = imgData.width * imgData.height
    var grayscaledData = imgData.data
    if (!option.grayscaled) {
      grayscaledData = grayscale(imgData).data
    }
    var newPixelData = new Uint8ClampedArray(pixelSize * 4)
    var redLookupTable = new Uint8ClampedArray(256)
    var greenLookupTable = new Uint8ClampedArray(256)
    var blueLookupTable = new Uint8ClampedArray(256)

    redLookupTable.forEach(function (d, i) {
      var n = 0
      if (i > 128 && i < 192) {
        n = (i - 128) * (256 / (192 - 128))
      }
      if (i >= 192) {
        n = 255
      }
      redLookupTable[i] = n
    })

    greenLookupTable.forEach(function (d, i) {
      var n = 255
      if (i < 64) {
        n = i * (256 / 64)
      }
      if (i >= 192) {
        n = 255 - ((i - 191) * (256 / (256 - 192)))
      }
      greenLookupTable[i] = n
    })

    blueLookupTable.forEach(function (d, i) {
      var n = 0
      if (i > 64 && i < 128) {
        n = 255 - ((i - 63) * (256 / (192 - 128)))
      }
      if (i < 65) {
        n = 255
      }
      blueLookupTable[i] = n
    })

    var pixel, index
    for (pixel = 0; pixel < pixelSize; pixel++) {
      index = pixel * 4
      newPixelData[index] = redLookupTable[grayscaledData[index]]
      newPixelData[index + 1] = greenLookupTable[grayscaledData[index + 1]]
      newPixelData[index + 2] = blueLookupTable[grayscaledData[index + 2]]
      newPixelData[index + 3] = imgData.data[index + 3]
    }

    return formatter(newPixelData, imgData.width, imgData.height)
  }

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
  grafi.pseudocolor = pseudocolor

  if (typeof module === 'object' && module.exports) {
    module.exports = grafi
  } else {
    this.grafi = grafi
  }
}())
