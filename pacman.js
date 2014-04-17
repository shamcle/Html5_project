(function($){

    //绘制吃豆人
    function eater(){
        var canvas = document.createElement("canvas"),
            context = canvas.getContext("2d");

        var x=100,y=100,r=50;
        var sPI = Math.PI * 1.25;
        var ePI = Math.PI * 0.75;
        var eX = x+8;
        var eY = y;

        context.beginPath();
        context.fillStyle = 'red';
        context.arc(x, y, r, sPI, ePI, false);
        context.lineTo(eX, eY);
        context.fill();



        return canvas;
    }

    document.body.appendChild(eater());

})(jQuery);