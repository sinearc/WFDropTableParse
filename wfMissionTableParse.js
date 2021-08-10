function cleanNonZeroFalsyProperties(item) {
    const newObj = {}
    for (const propKey in item) {
        if ((!item[propKey] && item[propKey] !== 0) || typeof(item[propKey]) === "function") {
            continue
        } else {
            newObj[propKey] = item[propKey]
        }
    } 
    return newObj
}

let missionTable = Array.from(document.getElementById("missionRewards").nextElementSibling.children[0].children)
console.log(missionTable)
let missionTableNoFalsyProps = missionTable.map(cleanNonZeroFalsyProperties)

let missionTablePairedChances = missionTableNoFalsyProps.map(item => {
    if (item.childElementCount === 2) {
        return {
            "drop": item.children[0].innerText,
            "chance": item.children[1].innerText,
            "classList": []
        }
    } else if (item.childElementCount === 1 && !item.classList.length) {
        return cleanNonZeroFalsyProperties(item.children[0])
    } else {
        return item
    }
})

console.log(missionTableNoFalsyProps)
let individualTablesNumber = missionTableNoFalsyProps.filter((item) => item.classList.length ? true : false)
let currentArray = missionTablePairedChances
let individualTableSlices = []
for (item of individualTablesNumber) {
    let arr = []
    for (row of currentArray) {
        if (row.classList.length) {
            let lastIndex = currentArray.indexOf(row)
            individualTableSlices.push(arr)
            currentArray = currentArray.slice(lastIndex + 1)
            break
        } else {
            arr.push(row)
        }
    }
}
console.log(individualTableSlices)

individualTableSlices.forEach(list => {
    list.forEach(item => {
        delete item.classList
    })
})

let individualTableRotations = individualTableSlices.map(slice => {
    let possibleRotations = [ "A", "B", "C" ]
    let rotations = []
    let returnObj = {
        "location": slice.shift().innerText,
        "rotations": null,
        "rotationList": [],
        "drops": []
    }
    let rotationNumber = slice.filter(item => item.localName === "th" ? true : false)
    let currentArray = slice.reverse()
    if (rotationNumber.length) {
        returnObj.rotations = rotationNumber.length
        for (each of rotationNumber) {
            const whichRotation = {
                "rotation": null,
                "drops": []
            }
            for (row of currentArray) {
                if (row.localName === 'th') {
                    whichRotation.rotation = row.innerText
                    currentArray = currentArray.slice(currentArray.indexOf(row) + 1)
                    break
                } else {
                    whichRotation.drops.push(row)
                }
            }
            rotations.push(whichRotation)
        }
        returnObj.rotationList = rotations.reverse()
        return returnObj        
    } else {
        returnObj.drops = slice.reverse()
        return returnObj
    }
})

individualTableRotations.forEach(each => {
    if (each.rotations) {
        each.rotationList.forEach(r => {
            r.drops.forEach(drop => {
                drop.rotation = r.rotation
                each.drops.push(drop)
            })
        })
    }
    else {
        each.drops.forEach(drop => {
            drop.rotation = null
        })
    }
})

console.log(individualTableRotations)