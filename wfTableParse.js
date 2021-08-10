/*
	JS function collection for parsing the hellscape that is the WARFRAME public drop table
	The tables are served as an immense series in a single HTML document, so don't be surprised if your browser struggles a bit at first
	For the same reason, expect a significant delay in the execution of any of these functions
	The table can be found at:
	https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html


*/

function cleanNonZeroFalsyProperties(item) {
	// Utility function that keeps information contained in the DOM while discarding null values
	// Done to optimize further processing
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

function trimFirstLastChar(str) {
	return str.slice(1, str.length - 1)
}

function mapSimpleTables(id) {
	// Maps simple two-column tables into a list of lists, one for each subtable
	// Used for Missions and Relics
	let Table = Array.from(document.getElementById(id).nextElementSibling.children[0].children)
	let TableNoFalsyProps = Table.map(cleanNonZeroFalsyProperties)

	let TablePairedChances = TableNoFalsyProps.map(item => {
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
	let individualTablesNumber = TableNoFalsyProps.filter((item) => item.classList.length ? true : false)
	let currentArray = TablePairedChances
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
	individualTableSlices.forEach(list => {
		list.forEach(item => {
			delete item.classList
		})
	})
	return individualTableSlices
}

function mapMissions(simpleTableMap) {
	let individualTableRotations = simpleTableMap.map(slice => {
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
	return individualTableRotations
}

function mapRelics(simpleTableMap) {
	let relics = simpleTableMap.map(individualRelicTable => {
		let relicHead = individualRelicTable.shift().innerText.split(" ")
		let relicObj = {
			era: relicHead[0],
			name: relicHead[1],
			refinement: trimFirstLastChar(relicHead.pop()),
			drops: individualRelicTable
		}
		return relicObj
	})
	return relics
}