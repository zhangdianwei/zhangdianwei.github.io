// import { Graph } from "@antv/x6";

X6.Graph.registerNode(
    'custom-node-width-port',
    {
        inherit: 'rect',
        width: 100,
        height: 40,
        attrs: {
            body: {
                stroke: '#8f8f8f',
                strokeWidth: 1,
                fill: '#fff',
                rx: 6,
                ry: 6,
            },
        },
        ports: {
            groups: {
                top: {
                    position: 'top',
                    attrs: {
                        circle: {
                            magnet: true,
                            stroke: '#8f8f8f',
                            r: 5,
                        },
                    },
                },
                bottom: {
                    position: 'bottom',
                    attrs: {
                        circle: {
                            magnet: true,
                            stroke: '#8f8f8f',
                            r: 5,
                        },
                    },
                },
            },
        },
    },
    true,
);

const graph = new X6.Graph({
    container: document.getElementById("container"),
    autoResize: true,
    background: {
        color: "#F2F7FA",
    },
    grid: true,
    panning: true,
    // mousewheel: true
});

const source = graph.addNode({
    shape: 'rect',
    x: 40,
    y: 40,
    label: 'hello',
    width: 100,
    height: 40,
    ports: {
        items: [
            {
                id: 'port_1',
                group: 'left',
                magnet: true,
            },
            {
                id: 'port_2',
                group: 'bottom',
                magnet: true,
            },
        ],
    },
})

const target = graph.addNode({
    shape: 'rect',
    x: 160,
    y: 180,
    width: 100,
    height: 40,
    label: 'world',
    ports: {
        items: [
            {
                id: 'port_3',
                group: 'right',
                magnet: true,
            },
            {
                id: 'port_4',
                group: 'top',
                magnet: true,
            },
        ],
    },
})

// graph.addEdge({
//     source: { cell: source, port: 'port_2' },
//     target: { cell: target, port: 'port_3' },
//     attrs: {
//         line: {
//             stroke: '#8f8f8f',
//             strokeWidth: 1,
//         },
//     },
// });

graph.centerContent()