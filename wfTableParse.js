/*
	JS function collection for parsing the hellscape that is the WARFRAME public drop table
	The tables are served as an immense series in a single HTML document, so don't be surprised if your browser struggles a bit at first
	For the same reason, expect a significant delay in the execution of any of these functions
	The table can be found at:
	https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html


*/

function cleanNonZeroFalsyProperties(item) {
	// Utility function that keeps information contained in the DOM while discarding null values
	// Done to optimize further processing (I use the term "optimize" very lightly here)
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
		/* The following admittedly expansive conditional is to handle the following:
			the Star Chart and Transient mission tables contain structurally identical information (two-column data)
			Star Chart tables label rotations with a row containing a single cell that spans 2 columns
			Transient tables label rotations similarly, but:
				the cell containing the rotation name does not span both columns
				the row contains an additional empty table data cell (<td></td>)
			The reason for this completely unnecessary discrepancy is unknown to me and probably unknown to DE
			Particularly sharp witted readers may think "well couldn't you just remove the extra cell?", to which I say:
				- No
				- Yes, but my personal policy is to not modify the original data of the DOM while parsing
				- Yes, but the corrections involved are significantly longer than this line
				- No
		*/
		if (item.childElementCount === 2 && item.children[0].innerText && item.children[1].innerText) {
			return {
				"drop": item.children[0].innerText,
				"chance": item.children[1].innerText,
				"classList": []
			}
			// don't ask about the empty classList
		} else if (!item.classList.length) {
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
	// Following conditional is to deal with the case of a single mission droptable in a category (Sortie)
	if (!individualTablesNumber.length) {
        individualTableSlices = [currentArray]
    }
	individualTableSlices.forEach(list => {
		list.forEach(item => {
			delete item.classList
		})
	})
	return individualTableSlices
}

function mapMissions(simpleTableMap) {
	/* Maps all mission-based reward tables, including:
		- Star Chart
		- "Key" missions (Mutalist Alad V Assasinate, Lephantis, Jordas Golem, etc.)		
		- "Dynamic Location" missions (Arbitration, Kuva Siphon, Nightmare, Granum Void, etc.)
		- Sortie drop table
	*/
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
	// handles sorting drops into their rotation lists (for missions that have rotations)
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
	// Very little to elaborate on here...
	// This function takes the result of passing the relic table id to mapSimpleTables and parses it to the relic data structures
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

class DropChance {
	constructor (mutilatedDOMNode) {
		this.drop = mutilatedDOMNode[1].innerText,
		this.chance = mutilatedDOMNode[2].innerText
	}
}

function mapBountyTable(id) {
	class BountyStage {
		constructor (mutilatedDOMNodes) {
			this.stage = mutilatedDOMNodes[1].innerText, this.drops = []
		}
		addDrop (drop) { this.drops.push(drop) }
	}
	
	class BountyRotation {
		constructor (mutilatedDOMNodes) {
			this.rotation = mutilatedDOMNodes[0].innerText, this.stages = []
		}
		addStage (stage) { this.stages.push(stage) }
	}
	
	class ProfitTakerRotation extends BountyRotation {
		constructor (mutilatedDOMNodes) {
			super (mutilatedDOMNodes)
		}
	}
	
	class Bounty {
		constructor (mutilatedDOMNodes) {
			this.bounty = mutilatedDOMNodes[0].innerText, this.rotations = []
		}
		addRotation (rotation) { this.rotations.push(rotation) }
	}
	let Table = Array.from(document.getElementById(id).nextElementSibling.children[0].children)
	let TableNoFalsyProps = Table.map(cleanNonZeroFalsyProperties)
	let TableByCells = TableNoFalsyProps.map(n => { 
		const cellArray = Array.from(n.cells) 
		const cleanCellArray = cellArray.map(cleanNonZeroFalsyProperties)
		return cleanCellArray
	})
	let chances = TableByCells.map(n => {
		if (n.length === 3) {
			return {
				drop: n[1].innerText,
				chance: n[2].innerText
			}
		}
		if (n.length === 2) { return new BountyStage(n) }
		let singleColumnText = n[0].innerText?.toLowerCase()
		if (singleColumnText && (singleColumnText.includes('rotation')) ) { return new BountyRotation(n) }
		if (singleColumnText && (singleColumnText.includes('phase') || singleColumnText.includes('completion')) ) { return new ProfitTakerRotation(n) }
		if (singleColumnText) { return new Bounty(n) }
		return n
	})
	const stages = []
	for (const item of chances) {
		if (item.constructor.name !== 'Object') { stages.push(item) }
		else { stages[stages.length - 1].addDrop(item) }
	}
	const rotations = []
	for (const item of stages) {
		if (item.constructor.name !== 'BountyStage') { rotations.push(item) }
		else { rotations[rotations.length - 1].addStage(item) }
	}
	const bounties = []
	const other = []
	for (const item of rotations) {
		if ((item.constructor.name === 'ProfitTakerRotation')) { other.push(item) }
		else if (item.constructor.name !== 'BountyRotation') { bounties.push(item) }
		else { bounties[bounties.length - 1].addRotation(item) }
	}
	if (other.length) {
		other[3].rotation = `${other[2].rotation} (${other[3].rotation})`
		other[4].rotation = `${other[2].rotation} (${other[4].rotation})`
		other.splice(2, 1)	
	}
	const separatorsRemoved = bounties.filter(n => n.constructor.name === 'Bounty')
	return [...separatorsRemoved, ...other]
}

console.log(mapBountyTable("cetusRewards"))
console.log(mapBountyTable("solarisRewards"))
console.log(mapBountyTable("deimosRewards"))

console.log(JSON.stringify(mapBountyTable("cetusRewards"), null, 2))
console.log(JSON.stringify(mapBountyTable("solarisRewards"), null, 2))
console.log(JSON.stringify(mapBountyTable("deimosRewards"), null, 2))



console.log(mapMissions(mapSimpleTables("missionRewards")))
console.log(mapMissions(mapSimpleTables("keyRewards")))
console.log(mapMissions(mapSimpleTables("transientRewards")))
console.log(mapMissions(mapSimpleTables("sortieRewards"))[0])