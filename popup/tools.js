function ce(name) {
    return document.createElement(name)
}

function sa(node, attrs) {
    for (let key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            if (key === 'className') {
                node.classList.add( attrs[key] )
            } else if (key === 'value' && node.tagName === 'INPUT') {
                node.value = attrs[key]
            } else {
                node.setAttribute(key, attrs[key])
            }
        }
    }
    return node
}