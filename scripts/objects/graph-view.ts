import { TFile } from "obsidian";
import { Path } from "scripts/utils/path";
import { MainSettings } from "scripts/settings/main-settings";

export class GraphView
{
	public nodeCount: number;
	public linkCount: number;
	public radii: number[];
	public labels: string[];
	public paths: string[];
	public linkSources: number[];
	public linkTargets: number[];

	static InOutQuadBlend(start: number, end: number, t: number): number
	{
		t /= 2;
		let t2 = 2.0 * t * (1.0 - t) + 0.5;
		t2 -= 0.5;
		t2 *= 2.0;
		return start + (end - start) * t2;
	}

	public constructor(forFiles: TFile[], minRadius: number, maxRadius: number, extraDepth: number = 0)
	{
		this.paths = forFiles.map(f => f.path);


		this.nodeCount = this.paths.length;
		this.linkSources = [];
		this.linkTargets = [];
		this.labels = [];
		this.radii = [];

		let linkCounts: number[] = [];

		for (let i = 0; i < this.nodeCount; i++)
		{
			linkCounts.push(0);
		}

		let resolvedLinks = Object.entries(app.metadataCache.resolvedLinks);
		let values = Array.from(resolvedLinks.values());
		let sources = values.map(v => v[0]);
		let targets = values.map(v => v[1]);

		for (let source of this.paths)
		{
			let sourceIndex = sources.indexOf(source);

			this.labels.push(new Path(source).basename);

			if (sourceIndex != -1)
			{
				let target = targets[sourceIndex];

				for (let link of Object.entries(target))
				{
					if (link[0] == source) continue;
					if (this.paths.includes(link[0]))
					{
						let path1 = source;
						let path2 = link[0];

						let index1 = this.paths.indexOf(path1);
						let index2 = this.paths.indexOf(path2);

						if (index1 == -1 || index2 == -1) continue;

						this.linkSources.push(index1);
						this.linkTargets.push(index2);

						linkCounts[index1] = (linkCounts[index1] ?? 0) + 1;
						linkCounts[index2] = (linkCounts[index2] ?? 0) + 1;
					}
				}
			}
		}

		let maxLinks = Math.max(...linkCounts);

		this.radii = linkCounts.map(l => GraphView.InOutQuadBlend(minRadius, maxRadius, Math.min(l / (maxLinks * 0.8), 1.0)));
		this.paths = this.paths.map(p => 
			{
				let path = new Path(p).setExtension(".html").makeUnixStyle().asString;
				if (MainSettings.settings.makeNamesWebStyle) path = Path.toWebStyle(path);
				return path;
			});

		this.linkCount = this.linkSources.length;
	}

	public static generateGraphEl(container: HTMLElement): HTMLElement
	{
		let graphWrapper = container.createDiv();
		graphWrapper.classList.add("graph-view-wrapper");

		let graphHeader = graphWrapper.createDiv();
		graphHeader.addClass("sidebar-section-header");
		graphHeader.innerText = "Interactive Graph";

		let graphEl = graphWrapper.createDiv();
		graphEl.className = "graph-view-placeholder";
		graphEl.innerHTML = 
		`
		<div class="graph-view-container">
			<div class="graph-icon graph-expand" role="button" aria-label="Expand" data-tooltip-position="top"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg></div>
			<canvas id="graph-canvas" width="512px" height="512px"></canvas>
		</div>
		`
		return graphWrapper;
	}
}
