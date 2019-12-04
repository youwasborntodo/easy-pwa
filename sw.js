
    // serviceWorker.js
    const edition = 'easy-pwa:2019-12-4|23:26:48'
    const fileList = [
  'http://apps.bdimg.com/libs/jquery/1.6.4/jquery.js',
      '/img/emoji1.gif',
      '/img/emoji2.gif',
      '/img/emoji3.gif',
      '/img/emoji4.gif',
      '/entry_sw.js',
      'test.html',
      
        ]  
    self.addEventListener('install', e => {
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
    