const max_len = (acc,cur)=>{
    if(cur.length > acc) return cur.length
    return acc
}

class Grid {
    constructor() {
        this.rows = []
        this.width = 0
        this.height = 0
    }
    load(str) {
        let lines = str.trim().split('\n')
        this.height = lines.length
        this.width = lines[0].length
        this.rows = []
        lines.map(line => {
            let row = []
            for(let i=0; i<line.length; i++) {
                let ch = line[i]
                // console.log("ch",ch)
                if(ch === '.') {
                    row.push({
                        value:MARKS.EMPTY,
                        mark:MARKS.UNKNOWN,
                    })
                    continue
                }
                if(ch === 'x') {
                    row.push({
                        value:MARKS.FILLED,
                        mark:MARKS.UNKNOWN,
                    })
                    continue
                }
                throw new Error("invalid cell value",ch)
            }
            this.rows.push(row)
        })
        console.log("final rows",this.rows)
    }
    getWidth() {
        return this.width
    }
    getHeight() {
        return this.height
    }
    isFilled(x,y) {
        let cell = this.rows[y][x]
        return cell.value === MARKS.FILLED
    }

    getMark(x, y) {
        return this.rows[y][x].mark
    }

    setMark(x,y, mark) {
        this.rows[y][x].mark = mark
    }
    reveal() {
        this.forEach((cell,x,y)=>{
            cell.mark = cell.value
        })
    }
    reset() {
        this.forEach((cell)=>{
            cell.mark = MARKS.UNKNOWN
        })
    }

    forEach(cb) {
        for(let j=0; j<this.rows.length; j++) {
            for(let i=0; i<this.rows[0].length; i++) {
                cb(this.rows[j][i],i,j)
            }
        }
    }

    isSolved() {
        let solved = true
        this.forEach(cell => {
            //if every marked filled really is filled
            //if every filled is marked filled
            //don't care about the others
            if(cell.mark === MARKS.FILLED && cell.value !== MARKS.FILLED) {
                solved = false
            }
            if(cell.value === MARKS.FILLED && cell.mark !== MARKS.FILLED) {
                solved = false
            }
        })
        return solved
    }
}

const COLORS = {
    BGCOLOR:'white',
    GRIDCOLOR:'#1a1919',
    FILLEDCOLOR:'#f31717',
    EMPTYCOLOR:'#94ee09',
    UNKNOWNCOLOR:'hsl(0,0%,80%)'
}

const MARKS = {
    UNKNOWN:'UNKNOWN',
    FILLED:'FILLED',
    EMPTY:'EMPTY',
}

class View {
    constructor(canvas, grid) {
        this.canvas = canvas
        this.canvas.addEventListener('click',(e)=>this.handle_click(e))
        this.grid = grid
        this.reinit()
    }
    drawGridlines(ctx) {
        let sc = this.calcScale()
        ctx.fillStyle = COLORS.BGCOLOR
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
        ctx.lineWidth = 1.5
        ctx.strokeStyle = COLORS.GRIDCOLOR
        ctx.beginPath()
        let gw = this.vmax+grid.getWidth()
        let gh = this.hmax+grid.getHeight()
        for(let i=0; i<gw+1; i++) {
            ctx.moveTo(i*sc,0)
            ctx.lineTo(i*sc,gh*sc)
        }
        for(let i=0; i<gh+1; i++) {
            ctx.moveTo(0,i*sc)
            ctx.lineTo(gw*sc,i*sc)
        }
        ctx.stroke()
    }
    drawGameboard(ctx) {
        let sc = this.calcScale()
        for(let i=0; i<grid.getWidth();i++) {
            for(let j=0; j<grid.getHeight(); j++) {
                let mk = grid.getMark(i,j)
                if(mk === MARKS.FILLED) ctx.fillStyle = COLORS.FILLEDCOLOR
                if(mk === MARKS.UNKNOWN) ctx.fillStyle = COLORS.UNKNOWNCOLOR
                if(mk === MARKS.EMPTY) ctx.fillStyle = COLORS.EMPTYCOLOR
                let x = ((i+this.vmax)*sc)+1
                let y = ((j+this.hmax)*sc)+1
                ctx.fillRect(x,y,sc-2,sc-2)
            }
        }
    }
    calcHClues() {
        let cls = []
        for(let col=0; col<grid.getWidth(); col++) {
            let clues = []
            let run = 0
            for(let row=0; row<grid.getHeight(); row++) {
                if(grid.isFilled(col,row)) {
                    run++
                } else {
                    clues.push(run)
                    run=0
                }
            }
            clues.push(run)
            clues = clues.filter(num => num > 0)
            cls.push(clues)
        }
        return cls
    }
    calcVClues() {
        let cls = []
        for(let row=0; row<grid.getHeight(); row++) {
            let clues = []
            let run = 0
            let inside = false
            for(let col=0; col<grid.getWidth(); col++) {
                // first time through
                if(col === 0 && grid.isFilled(col,row)) inside = true

                if(grid.isFilled(col,row)) {
                    if(inside) {

                    }
                    run++
                } else {
                    clues.push(run)
                    run=0
                }
            }
            clues.push(run)
            clues = clues.filter(num => num > 0)
            cls.push(clues)
        }
        return cls
    }
    redraw() {
        this.resize()
        let ctx = $("#canvas").getContext('2d')
        this.drawGridlines(ctx) //done
        this.drawGameboard(ctx) // done
        this.drawClues(ctx)
    }

    handle_click(e) {
        let pt = this.canvasToGrid(e)
        if(pt.x < 0 || pt.y < 0) return
        let mk = grid.getMark(pt.x,pt.y)
        if(mk === MARKS.FILLED) grid.setMark(pt.x,pt.y,MARKS.EMPTY)
        if(mk === MARKS.UNKNOWN) grid.setMark(pt.x,pt.y,MARKS.FILLED)
        if(mk === MARKS.EMPTY) grid.setMark(pt.x,pt.y,MARKS.UNKNOWN)
        if(grid.isSolved()) {
            $(".message-scrim").classList.remove('hide')
            $(".message-text").innerHTML = 'You did it!<br/> Merry Christmas Jesse!'
        }
        this.redraw()
    }

    canvasToGrid(e) {
        let rect = e.target.getBoundingClientRect()
        let pt = {
            x:Math.floor((e.clientX-rect.x)/this.calcScale()),
            y:Math.floor((e.clientY-rect.y)/this.calcScale()),
        }
        let hclues = this.calcHClues()
        let vclues = this.calcVClues()
        let vmax = vclues.reduce(max_len,0)
        let hmax = hclues.reduce(max_len,0)
        pt.x -= vmax
        pt.y -= hmax
        return pt
    }

    drawClues(ctx) {
        let sc = this.calcScale()
        ctx.fillStyle = COLORS.GRIDCOLOR
        ctx.font = `${sc/2}px sans-serif`

        ctx.save()
        ctx.translate(this.vmax*sc,0)
        this.hclues.forEach((col,i)=>{
            col.forEach((clue,j )=>{
                ctx.fillText(""+clue,i*sc+sc*0.35,j*sc+sc*0.7)
            })
        })
        ctx.restore()

        ctx.save()
        ctx.translate(0,this.hmax*sc)
        this.vclues.forEach((row,j)=>{
            row.forEach((clue,i )=>{
                ctx.fillText(""+clue,i*sc+sc*0.35,j*sc+sc*0.7)
            })
        })
        ctx.restore()
    }

    resize() {
        let canvas = $("#canvas")
        canvas.width = canvas.clientWidth-1
        canvas.height = canvas.clientHeight-1
    }
    calcScale() {
        let w = this.vmax + this.grid.getWidth()
        let wsc = this.canvas.width/w
        let h = this.hmax + this.grid.getHeight()
        let hsc = this.canvas.height/h
        return Math.min(wsc,hsc)
    }

    reinit() {
        this.hclues = this.calcHClues()
        this.vclues = this.calcVClues()
        this.vmax = this.vclues.reduce(max_len,0)
        this.hmax = this.hclues.reduce(max_len,0)
    }
}


let grid = new Grid()
grid.load(`
..x.......x..
..xx.....xx..
..xxx...xxx..
.xxxxxxxxxxx.
xxxxxxxxxxxxx
xxxx.xxx.xxxx
xxxxxxxxxxxxx
xxxxxx.xxxxxx
xxxxx.x.xxxxx
.xxxxxxxxxxx.
..xxxxxxxxx..
....xxxxx....
`)

grid.reveal()

const $ = (sel) => document.querySelector(sel)
const on = (el,type,cb) => el.addEventListener(type,cb)

let canvas = $("#canvas")
let view = new View(canvas,grid)
view.redraw()

on($(".message-text"),'click',()=>{
     grid.reset()
    view.redraw()
    $(".message-scrim").classList.add('hide')
})

on(window,'resize',()=>{
    view.redraw()
})

let title = Array.from('Jesse Christmas Picross')
title = title.map(l => '<span>'+l+'</span>').join("")
$("#title").innerHTML = title