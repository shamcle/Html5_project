(function(){
    /*
     * 动画工具类，用户在固定时间间隔触发函数调用
     * @delay 毫秒数，时间间隔
     * @func 到达时间间隔后执行的函数
     */
    var Timer = function(time, func) {
        var startTimestamp = (+new Date());

        this.action = function() {
            var now = (+new Date());
            if(now - startTimestamp >= time) {
                startTimestamp = now;
                func();
            }
        };
    }
    /*
     * 键盘常量keyCode
     *
     */
    var keyCode = {
        LEFT : 37,
        RIGHT : 39,
        UP : 38,
        DOWN : 40
    }
    /*
     * clone数组
     */
    function cloneMaze(maze) {
        var a = [];
        for(var i = 0; i < maze.length; i += 1) {
            if(typeof(a[i]) != "object")
                a[i] = [];
            for(var j = 0; j < maze[i].length; j += 1) {
                a[i][j] = maze[i][j];
            }
        }
        return a;
    }

    /*
     * 随机数
     */
    function getRandomNum(min, max) {
        var rang = max - min;
        var rand = Math.random();
        return (min + Math.round(rand * rang));
    }

    /*
     * 毫秒数转为分秒
     */
    function formatTime(msec) {
        var seconds = parseInt(msec / 1000, 10), mm, ss;
        //得到分
        mm = seconds / 60 | 0;
        //得到秒
        ss = parseInt(seconds) - mm * 60;
        if(parseInt(mm) < 10) {
            mm = "0" + mm;
        }
        if(ss < 0){
            ss = 0;
        }
        if(ss < 10) {
            ss = "0" + ss;
        }
        return mm + ":" + ss;
    }

    var myBox = {
        init : function(maze, opts){
            var self = this,
                footer,
                defaults = {
                    blockSize : 30, //每格的宽高，对应二维数组
                    lineWidth : 4, //墙的宽度
                    wallColor : ['#009900', '#0033ff', '#cc0011', '#ffff00', '#00cc99', '#1133cc'], //墙的颜色
                    wcIndex : 0, //墙壁颜色数组下标
                    time : 9.1 * 10 * 1000//游戏时间
                };

            self.opts = opts || defaults;

            //缓存数据
            self._c = {
                wlen : self.opts.wallColor.length,
                pacman : {
                    i : 0,
                    j : 0,
                    sPI : 1.25,
                    ePI : 0.75,
                    mouth : 'big',
                    direction : 'stop'
                },
                monsters : [],
                time : self.opts.time,
                score : 0,
                to : 'stop'
            };

            self.body = document.body;

            //画布
            self.canvas = document.createElement("canvas");
            self.canvas.width = maze[0].length * self.opts.blockSize;
            self.canvas.height = maze.length * self.opts.blockSize;
            self.ctx = self.canvas.getContext("2d");
            self.body.appendChild(self.canvas);

            //底部div
            footer = document.createElement("footer");
            footer.style.margin = "0 auto";
            footer.style.color = "#FFF";
            footer.style.width = maze[0].length * (self.opts.blockSize - 1) + "px";
            footer.innerHTML = '<section style="float:left;margin-left:20px;width:150px">SCORE:<span id="score">0</span></section><section style="float:left;margin-left:10px;">TIME:<span id="time">' + formatTime(defaults.time-1000);+ '</time></section>';

            self.button = document.createElement("button");
            self.button.id = "start";
            self.button.innerHTML = "START";
            self.button.style.float = "right";
            self.button.onclick = function(){
                if (this.innerHTML == "STOP"){
                    self.stop();
                }else{
                    self.reset();
                    self.start();
                }
            };
            footer.appendChild(self.button);

            self.body.appendChild(footer);

            //提示框
            self.result = document.createElement("div");
            self.result.id = "result";
            self.result.style.color = 'rgb(255, 255, 0)'; 
            self.result.style.fontSize = '150px'; 
            self.result.style.width = '570px'; 
            self.result.style.position = 'absolute'; 
            self.result.style.left = '30%'; 
            self.result.style.top = '20%'; 
            self.result.style.display = 'none';

            self.body.appendChild(self.result);

            //布局参数
            self.maze = maze;
            //备份初始化数据
            self._maze = cloneMaze(maze);

            //绘制
            self.drawStage();
        },

        //定位
        getDw : function(i){
            return i * this.opts.blockSize + this.opts.blockSize / 2;
        },

        //清除画布
        clear : function() {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        },

        //处理迷宫数据（计算总分，缓存怪物数据）
        execMaze : function() {
            this._totalScore = 0;
            var k;
            for(var i = 0; i < this.maze.length; i += 1) {
                for(var j = 0; j < this.maze[i].length; j += 1) {
                    k = this.maze[i][j];
                    this._totalScore += (Math.abs(k) == 2 ? 10 : (Math.abs(k) == 3 ? 20 : 0));
                    if(k < 0)
                        this._c.monsters.push({
                            'i' : i,
                            'j' : j,
                            'direction' : 'stop'
                        });
                    //存储怪物的坐标
                }
            }
        },
        //初始化数据
        reset : function() {
            this.maze = cloneMaze(this._maze);
            //缓存数据
            this._c = {
                wlen : this.opts.wallColor.length,
                pacman : {
                    i : 0,
                    j : 0,
                    sPI : 1.25,
                    ePI : 0.75,
                    mouth : 'big',
                    direction : 'stop'
                },
                monsters : [],
                time : this.opts.time,
                score : 0
            };
            this.execMaze();
            this.drawStage();
            this.updateScore();
            this.updateTime();
            self.result.style.display = 'none';
        },

        //显示分数
        updateScore : function() {
            var score = document.getElementById("score");
            score.innerHTML = this._c.score;
            if(this._c.score == this._totalScore) {
                this.win();
            }
        },
        //显示时间
        updateTime : function() {
            var time = document.getElementById("time");
            time.innerHTML = formatTime(this._c.time);
            if(this._c.score < this._totalScore && this._c.time < 1000) {
                this.timeout();
            }
        },
        //显示结束
        showresult : function(msg){
            this.stop();
            this.result.innerHTML = msg;
            this.result.style.display = "block";
        },
        //获胜
        win : function() {
            this.showresult("YOU<br />WIN");
        },
        //输了
        guale : function() {
            this.showresult("YOU<br />LOST");
        },
        //时间到
        timeout: function(){
            this.showresult("TIME<br />OUT");
        },

        //开始游戏
        start : function() {
            var self = this, frameRate = 1000 / 30;
            //每秒30帧
            self.control();
            self._stageTimer = new Timer(3000, function() {
                self.opts.wcIndex = (self.opts.wcIndex < self._c.wlen - 1 ? self.opts.wcIndex + 1 : 0);
            });
            self._pacmanTimer = new Timer(200, function() {
                self._c.pacman.mouth = self._c.pacman.mouth == 'big' ? 'small' : 'big';
            });
            self._moveTimer = new Timer(150, function() {
                impact = self.impactTest(self._c.pacman.i, self._c.pacman.j, self._c.to);
                if(impact) {
                    self._c.pacman.direction = impact.direction;
                }
                self.moveItem(self._c.pacman.i, self._c.pacman.j, self._c.pacman.direction);
            });
            self._moveMonstersTimer = new Timer(200, function() {
                self.moveMonsters();
            });
            self.intervalID = setInterval(function() {
                self._stageTimer.action();
                self._pacmanTimer.action();
                self._moveTimer.action();
                self._moveMonstersTimer.action();
                self.drawStage();
                self.updateScore();
                self._c.time -= frameRate;
                self.updateTime();
            }, frameRate);

            self.button.innerHTML = "STOP";
        },

        //结束游戏
        stop : function() {
            var self = this;
            self.body.onkeydown = function(){};
            clearInterval(self.intervalID);
            self.button.innerHTML = "REPLAY";
        },

        //键盘控制
        control : function() {
            var self = this;
            self.body.onkeydown = function(event){
                event.preventDefault();
                event.stopPropagation();
                var impact, direction;
                switch(event.keyCode) {
                    case keyCode.LEFT:
                        self._c.pacman.sPI = 1.25;
                        self._c.pacman.ePI = 0.75;
                        self._c.to = 'left';
                        break;
                    case keyCode.RIGHT:
                        self._c.pacman.sPI = 0.25;
                        self._c.pacman.ePI = 1.75;
                        self._c.to = 'right';
                        break;
                    case keyCode.UP:
                        self._c.pacman.sPI = 1.75;
                        self._c.pacman.ePI = 1.25;
                        self._c.to = 'up';
                        break;
                    case keyCode.DOWN:
                        self._c.pacman.sPI = 0.75;
                        self._c.pacman.ePI = 0.25;
                        self._c.to = 'down';
                        break;
                }
            };
        },

        //怪物移动轨迹计算
        getMonsterNextDirection : function(i, j, direction) {
            var impact, d = ['left', 'right', 'up', 'down'], canGo = [];
            if(direction == 'left') {
                d = ['left', 'up', 'down'];
            } else if(direction == 'right') {
                d = ['right', 'up', 'down'];
            } else if(direction == 'up') {
                d = ['left', 'up', 'right'];
            } else if(direction == 'down') {
                d = ['left', 'down', 'right'];
            }
            //循环查找可以行走的路径，将能去的方向记录下来

            for(var _i = 0; _i < d.length; _i += 1) {
                impact = this.impactTest(i, j, d[_i]);
                if(impact)
                    canGo.push(d[_i]);
            }
            var rand = getRandomNum(0, canGo.length - 1);

            return canGo[rand] || direction;
        },

        //移动的怪物
        moveMonsters : function(i, j, direction) {
            var impact, k, d;
            for(var i = 0, len = this._c.monsters.length; i < len; i += 1) {
                k = this._c.monsters[i];
                d = this.getMonsterNextDirection(k.i, k.j, k.direction);
                impact = this.impactTest(k.i, k.j, d);

                if(impact) {
                    this.moveItem(k.i, k.j, impact.direction);
                    this._c.monsters[i] = {
                        'i' : impact.i,
                        'j' : impact.j,
                        'direction' : impact.direction
                    };
                } else {
                    this._c.monsters[i].direction = this.getMonsterNextDirection(k.i, k.j, 'stop');
                }
            }
        },

        //移动
        moveItem : function(i, j, direction) {
            var impact = this.impactTest(i, j, direction);
            var code = this.maze[i][j];

            if(code >= 0 && code != 9)
                return false;

            if(!impact)
                return false;
            //移动的是豆子先生
            if(code == 9) {
                if(this.maze[impact.i][impact.j] < 0) {
                    //碰撞是怪物
                    this.maze[impact.i][impact.j] = code;
                    this.maze[i][j] = 0;
                    this.guale();
                    return;
                }
                this.maze[impact.i][impact.j] = code;
                this.maze[i][j] = 0;
                this._c.score += impact.score;
            }
            //移动的是怪物
            else if(code < 0) {
                if(this.maze[impact.i][impact.j] == 9) {
                    //碰撞是豆子先生
                    this.maze[impact.i][impact.j] = 9;
                    this.maze[i][j] = code == -1 ? 0 : Math.abs(code);
                    this.guale();
                    return;
                }
                this.maze[impact.i][impact.j] = this.maze[impact.i][impact.j] == 0 ? -1 : -this.maze[impact.i][impact.j];
                this.maze[i][j] = code == -1 ? 0 : Math.abs(code);
            }
            return impact.direction;
        },

        //碰撞测试
        impactTest : function(i, j, direction){
            var toI = i,
                toJ = j,
                code = this.maze[i][j];

            switch (direction){
                case "left":
                    toJ--;
                    break;
                case "right":
                    toJ++;
                    break;
                case "up":
                    toI--;
                    break;
                case "down":
                    toI++;
                    break;
                default:
                    return false; 
            }

            var to = this.maze[toI][toJ];

            //如果当前移动的是怪物，碰撞目标也是怪物，则返回false，怪物掉头
            if(code < 0 && (to == 0 || to == 2 || to == 3 || to == 9)) {
                return {
                    'i' : toI,
                    'j' : toJ,
                    'direction' : direction,
                    'score' : 0
                };
            //如果移动的是豆子先生
            }else if(code == 9 && (to == 0 || Math.abs(to) == 2 || Math.abs(to) == 3)) {
                return {
                    'i' : toI,
                    'j' : toJ,
                    'direction' : direction,
                    'score' : to == 2 ? 10 : (to == 3 ? 20 : 0)
                };
            }
            return false;
        },

        drawStage : function(){
            this.clear();
            for(var i = 0; i < this.maze.length; i += 1) {
                for(var j = 0; j < this.maze[i].length; j += 1) {
                    switch(this.maze[i][j]) {
                        case 0:
                            break;
                        case 1:
                            this.drawWall(i, j);
                            break;
                        case 2:
                        case 3:
                            this.drawBeans(i, j, this.maze[i][j]);
                            break;
                        case 9:
                            this.draweater(i, j);
                            break;
                        case -1:
                        case -2:
                        case -3:
                            this.drawMonster(i, j);
                            break;
                        default:
                            break;
                    }
                }

            }
        },

        //画墙
        drawWall : function(i, j){
            var x = this.getDw(j), 
                y = this.getDw(i),
                list = [-1, +1],
                mv = this.opts.blockSize / 2;

            this.ctx.beginPath();
            this.ctx.strokeStyle = this.opts.wallColor[this.opts.wcIndex];
            this.ctx.lineWidth = this.opts.lineWidth;

            //绘制横线
            for (var n=0;n<list.length;n++){
                var py = list[n];
                if (this.maze[i][j+py]==this.maze[i][j]){
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x+mv*py, y);
                }
            }

            //绘制竖线
            for (var n=0;n<list.length;n++){
                var py = list[n];
                if (typeof(this.maze[i+py])!='undefined'&&this.maze[i+py][j]==this.maze[i][j]){
                    //补全由于线条留下的空白
                    this.ctx.moveTo(x, y-this.opts.lineWidth/2*py);
                    this.ctx.lineTo(x, y+mv*py);
                }
            }


            this.ctx.stroke();
        },

        //画小豆子
        drawBeans : function(i, j, lx){
            var x = this.getDw(j), 
                y = this.getDw(i),
                r = lx==2?3:8,
                c = lx==2?"yellow":"#ffffcc";

            this.ctx.beginPath();

            this.ctx.fillStyle = c;
            this.ctx.arc(x, y, r, 0, Math.PI*2, false);
            this.ctx.fill();
        },

        //画怪物
        drawMonster : function(i, j){
            var x = this.getDw(j), 
                y = this.getDw(i),
                r = Math.floor(this.opts.blockSize / 2);

            this.ctx.beginPath();
            //颜色跟其他的一样变化
            this.ctx.fillStyle = this.opts.wallColor[this.opts.wcIndex];
            //头盖骨
            this.ctx.arc(x, y, r, Math.PI * 1, 0, false);
            //往下
            this.ctx.lineTo(x + r, y + r / 2);
            //左折
            this.ctx.lineTo(x + r / 2, y + r / 2);
            //往下
            this.ctx.lineTo(x + r / 2, y + r);
            //往左
            this.ctx.lineTo(x - r / 2, y + r);
            //往上
            this.ctx.lineTo(x - r / 2, y + r / 2);
            //往左
            this.ctx.lineTo(x - r, y + r / 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.fillStyle = '#000';
            //眼睛
            this.ctx.arc(x - 7, y - 2, r / 3, 0, Math.PI * 2, false);
            this.ctx.arc(x + 7, y - 2, r / 3, 0, Math.PI * 2, false);

            //鼻子
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - 3, y + 6);
            this.ctx.lineTo(x + 3, y + 6);
            this.ctx.fill();

            //牙齿
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(x, y + r/2 + 3);
            this.ctx.lineTo(x, y + r);

            this.ctx.moveTo(x - 4, y + r/2 + 3);
            this.ctx.lineTo(x - 4, y + r);

            this.ctx.moveTo(x + 4, y + r/2 + 3);
            this.ctx.lineTo(x + 4, y + r);

            this.ctx.stroke();

        },

        //画吃豆人
        draweater : function(i, j){

            var x = this.getDw(j), 
                y = this.getDw(i),
                r = Math.floor(this.opts.blockSize / 2),
                diff = this._c.pacman.mouth == 'big' ? 0 : 0.17,
                eX = x,
                eY = y;

            this._c.pacman.i = i;
            this._c.pacman.j = j;

            this.ctx.beginPath();
            this.ctx.fillStyle = 'yellow';

            this.ctx.arc(x, y, r, Math.PI * (this._c.pacman.sPI-diff), Math.PI * (this._c.pacman.ePI+diff), false);
            this.ctx.lineTo(eX, eY);
            this.ctx.fill();
        }

    }
//     数值          说明
// ------------------------------------------------------------------------------------------------------
//  0            空地
//  1            墙
//  2            小豆子
//  3            大豆子
//  9            豆子先生
// -1            怪物（所有负值代表怪物，-1为怪物在空地，-7和-8代表怪物在豆子上）
// -2    
// -3
    var maze = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 3, 2, 2, 2, 2, 2, 2, 2, -3, 2, 2, 2, 2, 2, 2, 2, 3, 1], 
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1], 
        [1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1], 
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1], 
        [1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1], 
        [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], 
        [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], 
        [1, 3, 2, 2, 2, 2, 2, 2, 2, 9, 2, 2, 2, 2, 2, 2, 2, 3, 1], 
        [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1], 
        [1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1], 
        [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1], 
        [1, -3, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, -3, 1], 
        [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], 
        [0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0], 
        [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], 
        [1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    myBox.init(maze);
})();