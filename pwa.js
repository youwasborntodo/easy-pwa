#!/usr/bin/env node
//pwa
const fs = require('fs');
const path = require('path')
const PKG = require('./package.json')
const program = require("commander");
const terser = require('terser')
const jsDom = require("jsdom");
const SW_MODEL_EXPORT = `self.addEventListener('install', e => {
        console.log('installing.........')
        e.waitUntil(
            caches.open(edition).then(cache => {
                fileList.forEach((file, index) => {
                    cache.add(file).then(() => {
                        // console.log('installed===>', file)
                        // console.log('fileList.len===>', fileList.length)
                        if (index == fileList.length - 1) {
                            // 判断是否安装完成
                            console.log('files installed')
                            // const myObj2 = {
                            //     from: 'installing......',
                            //     content: edition
                            // }
                            // arrived.postMessage(myObj2)
                            self.skipWaiting()
                        }
                    }).catch(err => {
                        console.error(err)
                    })
                })
            })
        )
    })

    function deleteCache() {
        // 过滤删除除当前版本之外的所有缓存
        caches.keys().then(list => {
            // console.log(list)
            return Promise.all(
                list.filter(cacheName => {
                    return cacheName != edition
                }).map(cacheName => {
                    return caches.delete(cacheName)
                })
            )
        }).catch(err => {
            console.error(err)
        })
    }
    // self.addEventListener('installed', e => {
    //     console.log('【service worker】====> ' + edition + 'is installed!')
    // })

    self.addEventListener('error', event => {
        // 监听其它错误
        console.error('error==>', event)
    })

    self.addEventListener('unhandledrejection', event => {
        // 跨域加载资源出错时
        console.error('unhandledrejection==>', event)
    })

    self.addEventListener('activate', e => {
        console.log('service worker ' + edition + ' is running!')
        // arrived.onmessage = function (e) {
        //     console.log('activate========>', e.data)
        // }
        // const myObj2 = {
        //     from: 'activate',
        //     content: 'worker'
        // }
        // arrived.postMessage(myObj2)
        e.waitUntil(deleteCache())
    })

    self.addEventListener('fetch', e => {
        if (e.request.method !== 'GET') {
            return;
        }
        // const url = new URL(e.request.url)
        e.respondWith(
            caches.match(e.request).then(res => {
                if (res) {
                    return res
                }
                let fetchRequest = e.request.clone()
                return fetch(fetchRequest).then(response => {
                    if (!response || response.status != 200 || response.type != 'basic') {
                        return response
                    }
                    // 复制请求
                    const responseToCache = response.clone()
                    const getFile = fetchRequest.url.replace(fetchRequest.referrer, '/')
                    // if (fileList.includes(getFile)) {
                    // 判断当前请求的文件是否在允许缓存的文件配置列表中
                    caches.open(edition).then(cache => {


                        cache.put(e.request, responseToCache)

                    })
                    // }
                    return response
                })
            })
        )
    })
    `
const { JSDOM } = jsDom;
const attrFileList = []
const config = {
  entryScript: 'entry_sw.js',
  defaultEntry: 'index.html', // 如果不指定入口文件，默认在执行目录下查找index.html
  relativeFilePath: null,
  iconsPath: 'icons/',
  isBuild: false,
  isEntry: false, // 判断是否指定入口文件
  isDefault: true, // 是否执行默认操作      
  relativePath: process.cwd() ? process.cwd() : process.env.pwd,
  icons: [{
    "src": "/img/icon_s.png",
    "sizes": "48x48",
    "type": "image/png"
  },{
    "src": "/img/icon.png",
    "sizes": "96x96",
    "type": "image/png"
  },{
    "src": "/img/icon_m.png",
    "sizes": "152x152",
    "type": "image/png"
  },{
    "src": "/img/icon_x.png",
    "sizes": "192x192",
    "type": "image/png"
  },{
    "src": "/img/icon_xx.png",
    "sizes": "256x256",
    "type": "image/png"
  }]
}
const exceptFile= [
  'node_modules',
  'package.json',
  config.entryScript
]

// 定义版本和参数选项
program.command('version')
  .description('查看当前版本')
  .action(function() {
    config.isDefault = false
    console.log('当前版本:', PKG.version)
  })

program.command('entry <file>')
  .description('entry 【file】入口文件配置')
  .action(function (file) {
    // 判断有没有带入文件名，后期加入文件夹前缀功能
    config.isEntry = true
    config.isDefault = true
    entryFile(file)
  }).on('--help', function () {
    console.log('');
    console.log('Entry file【入口文件配置】:');
    console.log('');
    console.log('easy-pwa entry index.html [Default:默认为空自动寻找 index.html]');
    console.log('');
  })

program.command('build <file>')
  .description('build 【file】package.json 脚本配置入口文件命令专用')
  .action(function (file) {
    // 判断有没有带入文件名，后期加入文件夹前缀功能
    config.isEntry = true
    config.isBuild = true
    config.isDefault = true
    entryFile(file)
  }).on('--help', function () {
    console.log('');
    console.log('Entry file【入口文件配置】:');
    console.log('');
    console.log('easy-pwa entry index.html [Default:默认为空自动寻找 index.html]');
    console.log('');
  })

program.command('--help')
    .description('查看当前帮助选项')
    .action(function () {
      config.isDefault = false
      console.log('entry <file>【入口文件配置】');
      console.log('');
      console.log('easy-pwa entry index.html [Default:默认为空自动寻找 index.html]');
      console.log('');
    })
// 必须在.parse()之前，因为node的emit()是即时的
program.parse(process.argv);

function readFileList(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  // console.log('files===>', files);
  files.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (!exceptFile.includes(item)) {
      // 判断是否需要过滤的文件或者文件夹
      if (stat.isDirectory()) {
        // 判断是否是文件夹
        readFileList(path.join(dir, item), filesList);
      } else {
        const relativePath = fullPath.replace(__dirname, "").replace(/\\/g, '/')
        filesList.push(relativePath);
      }
    }

  });
  return filesList;
}

const filesList = []


function entryFile(file) {
  // 入口文件
  let filePath = null
  let fileName = null
  let path = null
  if (/\//mg.test(file)) {
    //  判断是否带有路径
    if (/(^.+\/)(\S+.html)$/mg.test(file)) {
      const fileExec = /(^.+\/)(\S+.html)$/mg.exec(file)
      path = fileExec[1]
      fileName = fileExec[2]
      config.defaultEntry = fileName
      config.relativeFilePath = path
    } else {
      throw new Error('请确认输入的路径格式是否正确！')
    }
  } else {
    config.defaultEntry = file
    config.relativeFilePath = ''
  }

  // console.log("process.env====>", relativePath);
  if (config.isBuild) {
    // 判断是否为package.json 集成脚本构建
    // relativePath = relativePath.replace('\\node_modules\\easy-pwa', '')
    filePath = config.relativePath
  }
  filePath = process.env.os && process.env.os == 'Windows_NT' ? config.relativePath + "\\" + file : config.relativePath + "/" + file
  let htmlText = null
  // console.log('filePath======>', filePath)
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
          const msg = `
          错误提示【Error msg】

          原因：未找到该文件: ${filePath}，请检查指定的入口文件是否存在！
        
          提示：可以自定义入口文件,例如【entry index.html】 

          需要了解其它帮助信息可以输入【 --help】
            `;
      console.error(msg);
      return false
    }
    htmlText = data;
    let newHTML = ''
    if (!htmlText.includes(`<script src="/${config.entryScript}"></script>`)) {
      // 判断是否己经存在注册入口文件
      const replaceText = `<script src="/${config.entryScript}"></script></body>`;
      newHTML = htmlText.replace(`</body>`, replaceText);
    } else {
      newHTML = htmlText
    }  
    if (!newHTML.includes(`<link rel="manifest" href="/manifest.json">`)) {
      // 判断是否己经存在Manifest.json文件
      const replaceText = `<link rel="manifest" href="/manifest.json">
      </head>`;
      newHTML = newHTML.replace(`</head>`, replaceText);
    }

    createFile(file, newHTML);
    const htmlDom = new JSDOM(htmlText);
    const parentDOM = htmlDom.window.document;
    getChildNodes(parentDOM);
    // console.log(attrFileList)
    attrFileList.push(config.defaultEntry);
    copyServiceWorkerFile(attrFileList);
  });
}

function copyServiceWorkerFile(list) {
  // 拼接sw.js文件
  const dateTime = new Date()
  const buildTime = dateTime.toLocaleString().replace(' ', '|')
  // console.log('edition', buildTime)
  let SW_DATA = `
    // serviceWorker.js
    const edition = 'easy-pwa:${buildTime}'
    const fileList = [
  `
    list.forEach(str => {
        SW_DATA += `'${str}',
      `
    })
    SW_DATA += `
        ]  
    `
  SW_DATA = SW_DATA + SW_MODEL_EXPORT
      createServiceWorkerFile(SW_DATA)
    // })
}

function getChildNodes(node) {
  // 获取所有节点
  if (node.hasChildNodes()) {
    let doms = node.childNodes;
    doms.forEach(child => {
      if (child.nodeType == 1) {
        // domList.push(child.nodeName);
        getChildNodes(child);
        getAttrList(child)
      }
    });
  }
}

function getAttrList(node) {
  // 过滤链接文件列表
  switch (node.nodeName) {
    case 'LINK':
    case 'A':
      let href = node.getAttribute('href')
      // console.log(href)
      if (href) {
        attrFileList.push(href)
      }
      break;
    case 'SCRIPT':
    case 'IMG':
      let src = node.getAttribute('src')
      // console.log(src)
      if (src) {
        attrFileList.push(src)
      }
      break;
    default:
      // console.log(node.nodeName)
  }
}

const Manifest = `
    {
      "name": "PWA应用",
      "short_name": "测试名称",
      "description": "这只是一个测试应用！",
      "start_url": "${config.defaultEntry}",
      "display": "standalone",
      "orientation": "any",
      "background_color": "#ACE",
      "theme_color": "#ACE",
      "icons": [{
            "src": "${config.iconsPath}icon_s.png",
            "sizes": "48x48",
            "type": "image/png"
          },{
            "src": "${config.iconsPath}icon.png",
            "sizes": "96x96",
            "type": "image/png"
          },{
            "src": "${config.iconsPath}icon_m.png",
            "sizes": "152x152",
            "type": "image/png"
          },{
            "src": "${config.iconsPath}icon_x.png",
            "sizes": "192x192",
            "type": "image/png"
          },{
            "src": "${config.iconsPath}icon_xx.png",
            "sizes": "256x256",
            "type": "image/png"
          }]
    }
`

function createImageFile(source, target) {
  // 创建manifest.json 图标
  fs.readFile(source, (err, buffer) => {
    if (err) {
      console.error(err)
      throw new Error('请检查图片格式或者源路径是否正确！')
    } else {
      // console.log(source, '读取图片成功')
      const item = {
        buffer,
        target
      }
      bufferList.push(item)
      if (bufferList.length == config.icons.length) {
          bufferList.forEach(data => {
            // 处理异步问题
            createFile(data.target, data.buffer)
          })
      }
    }
  })
}
const bufferList = []
function multipleCreateImageFile(targetPath) {
  // 批量操作图片文件
  config.icons.forEach(file => {
    // console.log(file.src)
    let target = null
    const pathSplit = file.src.split('/')
    const fileName = pathSplit[pathSplit.length - 1]
    target = targetPath + fileName
    const source = __dirname + file.src
    createImageFile(source, target)
  })
}
function createManifestFile() {
  // 创建manifest.json文件
  let targetPath = config.relativeFilePath + config.iconsPath;
  const paths = config.relativePath + "/" + targetPath;
    fs.access(paths, err => {
      // 创建文件夹是否存在
      if (err) {
        fs.mkdir(paths, err => {
          if (err) {
            console.log(err)
            throw new Error("创建目录失败！")
          } else {
            multipleCreateImageFile(targetPath)
          }
        })
      } else {
        multipleCreateImageFile(targetPath)
      }
    })


  // console.log('bufferList==>', bufferList)

  createFile(config.relativeFilePath + 'manifest.json', Manifest)
}

function createServiceWorkerFile(data) {
  // 创建Service Worker文件
  const serviceWorkerFileName = config.relativeFilePath + 'sw.js'
  const entryScript = config.relativeFilePath + config.entryScript
  const indexFileData = `
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js').then(res => {
      // console.log('service worker is registered', res)
      let sw = null, state;
      if (res.installing) {
        sw = res.installing
        state = 'installing'
      } else if (res.waiting) {
        // 更新完成等待运行
        sw = res.waiting
        state = 'waiting'
      } else if (res.active) {
        // 更新完成激活状态
        sw = res.active
        state = 'activated'
      } else if (res.redundant) {
        // 新的缓存生效后之前的缓存会进入此状态
        sw.res.redundant
        state = 'redundant'
      }
      if (state) {
        console.log('【---SW---】 state is ' + state)
        if (state === 'waiting') {
          // 刷新后判断是否为等待状态
          // self.skipWaiting()
        }
      }
  
      if (sw) {
        sw.onStateChange = () => {
          console.log('sw state is ' + sw.state)
        }
      }
    }).catch(err => {
      console.error('something error is happened', err)
    })

  }
  `
  const path = __dirname // 目前配置是当前路径，后期需要增加自定义路径功能，预留路径判断功能
  // terser 
  const options = {
    toplevel: true,
    compress: {
        global_defs: {
            "@console.log": "console.info"
        },
        passes: 2
    },
    output: {
        beautify: false,
        preamble: "/* minified */"
    }
  }
  const result = terser.minify(data, options)
  // console.log(result)
  const uglifyDealWithData = result.code
  // console.log(uglifyDealWithData)
  fs.exists(path, exists => {
    if (exists) {
      // 判断当前路径是否存在
      createFile(serviceWorkerFileName, uglifyDealWithData)
      createFile(entryScript, indexFileData)
    } else {
      fs.mkdir(path, err => {
        // 创建文件夹
        if(err) {
          return false
        } else {
          createFile(serviceWorkerFileName, uglifyDealWithData)
          createFile(entryScript, indexFileData)
        }
      })
    }
  })
  createManifestFile()
}

function createFile (serviceWorkerFileName, data) {
  // 写入数据
  // console.log('开始写入', fileName)
  fs.writeFile(serviceWorkerFileName, data, "utf-8", err => {
    if (err) {
      console.error(err);
      return false;
    } else {
      console.log(serviceWorkerFileName, "写入成功");
    }
  });
}

if (!config.isEntry && config.isDefault) {
  // readFileList(__dirname, filesList)
  // 默认执行文件
  entryFile(config.defaultEntry)
}
