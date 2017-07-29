
function aAlert(text) {

    let node = document.getElementById('aAlert')

    node.innerText = text
    node.style.display = 'block'

}

function click(e, config) {

    let roleId = parseInt(e.target.id, 10)

    let iframeSelector = 'iframe[allowfullscreen]'

    chrome.tabs.executeScript(null, {
        code: "document.querySelector('"+iframeSelector+"').src"
    }, result => {
        if (!result || result.filter(x => x).length === 0) {
            aAlert("No vk app on this page")
        }
        result.forEach( url => {
            if (url) {
                let newHref = makeStringAdmin(url, roleId, config)
                chrome.tabs.executeScript(null, {
                    code: 'document.querySelector(\''+iframeSelector+'\').src = "'+newHref+'"'
                })
            }
        } )
    })
}


function makeStringAdmin(url, roleId, config) {
    let u = new URL(url)
    u.searchParams.set("viewer_type", roleId)
    let appId = parseInt(u.searchParams.get('api_id'))
    let sign = ''
    for (let key of u.searchParams.keys()) {
        if (key === 'hash' || key === 'sign' || key === 'api_result') continue
        if (key === 'ad_info') {
            continue
        }
        sign += decodeURIComponent( u.searchParams.get(key) )
    }

    let secret = null
    let cfg = config.filter( x => parseInt(x.id, 10) === appId ).pop()
    if (!cfg) {
        aAlert("Secret for appId "+appId+" not found")
        return url
    } else {
        secret = cfg.secret
    }

    sign = CryptoJS.HmacSHA256(sign, secret)
    u.searchParams.set("sign", sign.toString())
    return u.href
}


function createConfigComponent(config, onChange) {

    let tr = ce('tr')
    let td = ce('td')

    let id = sa( ce('input'), {
        placeholder: 'App id',
        title: 'App id',
        className: 'app-id',
        value: config.id,
        type: 'text'
    } )

    id.onkeyup = (e) => {
        onChange({id: e.target.value})
    }


    td.appendChild(id)

    let td2 = ce('td')

    let secret = sa( ce('input'), {
        placeholder: 'secret',
        title: 'secret',
        className: 'app-secret',
        value: config.secret,
        type: 'text'
    } )

    secret.onkeyup = (e) => {
        onChange({secret: e.target.value})
    }

    td2.appendChild(secret)
    tr.appendChild(td)
    tr.appendChild(td2)
    return {
        root: tr,
    }
}

function saveConfig(config) {
    let x = config.filter( x => x.id || x.secret )
    chrome.storage.sync.set({'config': JSON.stringify(x)}, () => {})
}

function loadConfig() {
    return new Promise( resolve => {
        chrome.storage.sync.get('config', (r) => {
            if (r.config) {
                resolve(JSON.parse(r.config))
            } else  {
                resolve([{id:'', secret:''}])
            }
        })
    } )
}

document.addEventListener('DOMContentLoaded', run)


function run() {
    loadConfig().then( config => render(config) )
}

function render(config) {

    let root =  document.getElementById('config')

    let ss = null

    let afterListUpdate = () => {
        let filled = config.filter( x => x.id || x.secret ).length
        let total = config.length

        if (filled === total) {
            let c = { id: '', secret: '' }
            config.push( c )
            let component = createConfigComponent(c, (e) => { c = Object.assign(c, e); afterListUpdate() })
            root.appendChild(component.root)
        }

        clearTimeout(ss)
        ss = setTimeout( () => { saveConfig(config) }, 1 )
    }

    config.forEach( c => {
        let component = createConfigComponent(c, (e) => { c = Object.assign(c, e); afterListUpdate() })
        root.appendChild(component.root)
    } )

    afterListUpdate()

    document.querySelectorAll('button.role').forEach( btn => {
        btn.addEventListener('click', (e) => click(e, config))
    } )
}