console.log('10.1');

var m = {t:50,r:50,b:50,l:50},
    w = document.getElementById('partition').clientWidth - m.l - m.r,
    h = document.getElementById('partition').clientHeight - m.t - m.b;

var metadata = d3.map();

var scaleColor = d3.scaleOrdinal().range(d3.schemeCategory10);

//Add <svg> to each drawing
d3.selectAll('.canvas')
    .append('svg')
    .attr('width', w + m.l + m.r)
    .attr('height', h + m.t + m.b)
    .append('g').attr('class','plot')
    .attr('transform','translate('+ m.l+','+ m.t+')');

//Load data
d3.queue()
    .defer(d3.csv, '../data/co2 emission-2.csv', parse)
    .defer(d3.csv, '../data/metadata.csv', parseMetadata)
    .await(dataLoaded);

function dataLoaded(err, data){
    //nest by region
    var dataByRegion = d3.nest()
        .key(function(d){return d.region})
        .entries(data);

    //Create an object that represents the entire tree, then turn it into a hierarchy
    //https://github.com/d3/d3-hierarchy#hierarchy
    var root = d3.hierarchy({
        key:"world",
        values: dataByRegion
    }, function(d){return d.values});

    //https://github.com/d3/d3-hierarchy#node_sum
    root.sum(function(d){return d.emission});

    drawPartition(root);
    drawPack(root);
    drawTreemap(root);
    drawTree(root);
    drawCluster(root);
}

function drawPartition(root){

    //Sort nodes by descending value
    root.sort(function(a,b){return b.height - a.height || b.value - a.value});

    //https://github.com/d3/d3-hierarchy#partition
    var layout = d3.partition()
        .size([w,h]);

    //Perform a partition layout on the root object
    layout(root);
    console.log(root); //what does it look like now?

    var plot = d3.select('#partition').select('.plot');

    var nodes = plot.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g').attr('class','node');

    nodes.attr('transform',function(d){
        return 'translate('+ d.x0+','+ d.y0+')';
    });
    nodes.append('rect')
        .attr('width',function(d){return d.x1- d.x0})
        .attr('height',function(d){return d.y1 - d.y0})
        .style('stroke','white')
        .style('fill',function(d){
            if(d.height == 1){
                return 'rgb(240,240,240)'
            }else if(!(metadata.get(d.data.code))){
                return
            }else{
                return scaleColor((metadata.get(d.data.code)).group);
            }
        });
    nodes.append('text')
        .text(function(d){
            if((d.x1 - d.x0)>20){return d.data.key || d.data.code};
        })
        .attr('dx',5)
        .attr('dy',20);
}

function drawPack(root){

    var layout = d3.pack()
        .padding(2)
        .size([w,h]);

    layout(root);
    console.log(root);

    var plot = d3.select('#pack').select('.plot');

    var nodes = plot.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g').attr('class','node');

    nodes.attr('transform',function(d){
        return 'translate('+ d.x+','+ d.y+')';
    });
    nodes.append('circle')
        .attr('r',function(d){return d.r})
        .style('fill',function(d){
            if(d.height == 1){
                return 'rgb(240,240,240)'
            }else if(!(metadata.get(d.data.code))){
                return
            }else{
                return scaleColor((metadata.get(d.data.code)).group);
            }
        });
    nodes.append('text')
        .text(function(d){
            if(d.r>20){return d.data.key || d.data.code};
        })
        .attr('text-anchor','middle')
        .attr('dy',10);
}

function drawTreemap(root){
    var layout = d3.treemap()
        .size([w,h])
        .paddingOuter(5);

    layout(root);

    var plot = d3.select('#treemap')
        .select('.plot');

    var nodes = plot.selectAll('.node')
        .data(root.leaves()) //
        .enter()
        .append('g').attr('class','node');

    nodes.attr('transform',function(d){
        return 'translate('+ d.x0+','+ d.y0+')';
    });
    nodes.append('rect')
        .attr('width',function(d){return d.x1- d.x0})
        .attr('height',function(d){return d.y1 - d.y0})
        .style('stroke','white')
        .style('fill',function(d){
            if(d.height == 1){
                return 'rgb(240,240,240)'
            }else if(!(metadata.get(d.data.code))){
                return
            }else{
                return scaleColor((metadata.get(d.data.code)).group);
            }
        });
    nodes.append('text')
        .text(function(d){
            if((d.x1 - d.x0)>20){return d.data.key || d.data.code};
        })
        .attr('dx',5)
        .attr('dy',20);

}

function drawTree(root){
    //Re-calculate width and height just for this particular instance
    w = document.getElementById('tree').clientWidth - m.l - m.r;
    h = document.getElementById('tree').clientHeight - m.t - m.b;

    var plot = d3.select('#tree')
        .select('svg')
        .attr('width',w + m.l + m.r)
        .attr('height',h + m.t + m.b)
        .select('.plot');


    var layout = d3.tree()
        .size([h,w])
        .separation(function(a,b){
            return (a.parent == b.parent)?2:5;
        });

    layout(root);

    var nodes = plot.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g').attr('class','node');

    nodes.attr('transform',function(d){
        return 'translate('+ d.y+','+ d.x+')';
    });
    nodes.append('circle')
        .attr('r',3)
        .style('fill',function(d){
            if(d.height == 1){
                return 'rgb(240,240,240)'
            }else if(!(metadata.get(d.data.code))){
                return
            }else{
                return scaleColor((metadata.get(d.data.code)).group);
            }
        });
    nodes.append('text')
        .text(function(d){
            return d.data.key || d.data.code;
        })
        .attr('dy',5)
        .attr('dx',function(d){
            if(!d.children) return 5;
            return -5;
        })
        .attr('text-anchor',function(d){
            if(!d.children) return 'start';
            return 'end';
        });

    var links = plot.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path').attr('class','link')
        .attr('d',function(d){
            var path = d3.path();
            path.moveTo(d.source.y, d.source.x);
            path.bezierCurveTo(
                (d.source.y+ d.target.y)/2, d.source.x,
                (d.source.y+ d.target.y)/2, d.target.x,
                d.target.y, d.target.x);
            return path.toString();
        })
        .style('fill','none')
        .style('stroke','rgba(80,80,80,.5)');

}

function drawCluster(root){

}

function parse(d){
    return {
        country: d['Country Name'],
        code: d['Country Code'],
        emission: d['2011 [YR2011]']=='..'?undefined:+d['2011 [YR2011]'],
        region: d.Region
    }
}
function parseMetadata(d){
    metadata.set(d.Code,{
        group:d['Income Group'],
        region: d.Region
    });
}



