window.__ModuleLoader__.load({
	id: "dsh-plugin-xiaoliuren",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		// ============ 六宫数据（与 src/core/palaces.ts 保持一致） ============
		var PALACES = [
			{ index: 1, name: "大安", auspicious: true, wuxing: "木", direction: "东", shensha: "青龙", verdict: "所问之事大体安稳顺利，成功可能性较高", advice: "按原计划稳步行事，宜早不宜迟", verse: "大安事事昌，求谋在坤方；失物去不远，宅舍保安康。", interpretation: "身未动，诸事安稳" },
			{ index: 2, name: "留连", auspicious: false, wuxing: "水", direction: "南", shensha: "玄武", verdict: "所问之事易拖延反复，短期难见结果", advice: "暂缓推进，重新审视方案或等时机", verse: "留连事难成，求谋日未明；官事只宜缓，去者未回程。", interpretation: "卒未归，事有拖延" },
			{ index: 3, name: "速喜", auspicious: true, wuxing: "火", direction: "南", shensha: "朱雀", verdict: "所问之事进展较快，多有助力，成功在望", advice: "抓住时机快速行动，勿错失良机", verse: "速喜喜来临，求财向南行；失物申未午，逢人路上寻。", interpretation: "人便至，喜事临门" },
			{ index: 4, name: "赤口", auspicious: false, wuxing: "金", direction: "西", shensha: "白虎", verdict: "所问之事阻力较大，易有口舌是非或争执", advice: "谨言慎行，注意沟通与合同细节", verse: "赤口主口舌，官非切要防；失物急去寻，行人有惊慌。", interpretation: "官事凶，口舌是非" },
			{ index: 5, name: "小吉", auspicious: true, wuxing: "木", direction: "北", shensha: "六合", verdict: "所问之事大吉，成功可期，诸事顺遂", advice: "宜积极行动，趁势而为", verse: "小吉最吉昌，路上好商量；阴人来报喜，失物在坤方。", interpretation: "人来喜，诸事顺遂" },
			{ index: 6, name: "空亡", auspicious: false, wuxing: "土", direction: "中", shensha: "勾陈", verdict: "所问之事易落空或变数大，难达预期", advice: "宜观望、降低预期或重新规划", verse: "空亡事不长，阴人多乖张；求财无利益，行人有灾殃。", interpretation: "音信稀，事多落空" }
		];
		var SHICHEN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
		var DISCLAIMER = "以上为传统民俗文化娱乐参考，不构成任何专业建议。";

		// ============ 算法（与 src/core 一致） ============
		function mod6(n) { return ((n % 6) + 6) % 6; }
		function shichenFromHour(h) { return Math.floor(((h + 1) % 24) / 2) + 1; }
		function shichenName(o) { return SHICHEN[mod6(o - 1)]; }
		function compute(month, day, hour) {
			var m = mod6(month - 1);
			var d = mod6(day - 1);
			var h = mod6(hour - 1);
			var final0 = mod6(m + d + h);
			return {
				steps: [
					{ phase: "月", number: month, palace: PALACES[m] },
					{ phase: "日", number: day, palace: PALACES[mod6(m + d)] },
					{ phase: "时", number: hour, palace: PALACES[final0] }
				],
				palace: PALACES[final0]
			};
		}
		function castTime(now) {
			var d = now || new Date();
			return compute(d.getMonth() + 1, d.getDate(), shichenFromHour(d.getHours()));
		}
		function castNumbers(nums) {
			var now = new Date();
			var month = nums.length >= 1 ? nums[0] : now.getMonth() + 1;
			var day = nums.length >= 2 ? nums[1] : now.getDate();
			var hour = nums.length >= 3 ? nums[2] : shichenFromHour(now.getHours());
			return compute(month, day, hour);
		}
		function randomInt(min, max) {
			var span = max - min + 1;
			if (typeof crypto !== "undefined" && crypto.getRandomValues) {
				var buf = new Uint32Array(1);
				crypto.getRandomValues(buf);
				return min + (buf[0] % span);
			}
			return min + Math.floor(Math.random() * span);
		}
		function castRandom() {
			return compute(randomInt(1, 12), randomInt(1, 30), randomInt(1, 12));
		}

		function formatCard(res) {
			var p = res.result;
			var trace = res.steps.map(function (s) { return s.palace.name + "(" + s.phase + ")"; }).join(" → ");
			var lines = ["【小六壬】结果"];
			if (res.question) lines.push("所问：" + res.question);
			lines.push("起卦：" + res.castLine);
			lines.push("掌诀：" + trace);
			lines.push("结论：" + p.verdict + " —— " + p.advice);
			lines.push("（" + (p.auspicious ? "吉" : "凶") + "｜" + p.wuxing + "｜" + p.direction + "｜" + p.shensha + "）");
			lines.push("断辞：" + p.verse);
			lines.push("※ " + res.disclaimer);
			return lines.join("\n");
		}

		// ============ 样式（内联，跟随 DSH 主题变量，带兜底值） ============
		var css = {
			root: { position: "relative", display: "inline-flex" },
			trigger: { width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.15))", background: "var(--dsw-alias-fill-l2, rgba(0,0,0,0.06))", color: "var(--dsw-alias-label-primary, #1f2328)", fontSize: 13, lineHeight: 1, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 },
			panel: { position: "absolute", top: "calc(100% + 6px)", right: 0, width: 340, maxWidth: "min(400px, calc(100vw - 24px))", maxHeight: "min(70vh, 640px)", overflowY: "auto", zIndex: 100, boxSizing: "border-box", border: "1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.15))", background: "var(--dsw-specific-menu, #fff)", boxShadow: "var(--dsw-shadow-lv3, 0 8px 24px rgba(0,0,0,0.18))", borderRadius: 12, padding: 14, color: "var(--dsw-alias-label-primary, #1f2328)", fontSize: 13 },
			title: { fontSize: 14, fontWeight: 600, marginBottom: 10 },
			tabs: { display: "flex", gap: 6, marginBottom: 10 },
			tab: { flex: 1, padding: "5px 0", fontSize: 12, border: "1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.15))", borderRadius: 8, background: "var(--dsw-alias-fill-l2, rgba(0,0,0,0.06))", color: "var(--dsw-alias-label-secondary, #59636e)", cursor: "pointer", textAlign: "center" },
			tabActive: { flex: 1, padding: "5px 0", fontSize: 12, border: "1px solid var(--dsw-accent, #4f6ef7)", borderRadius: 8, background: "var(--dsw-accent-soft, rgba(79,110,247,0.12))", color: "var(--dsw-accent, #4f6ef7)", cursor: "pointer", textAlign: "center", fontWeight: 600 },
			numsRow: { display: "flex", gap: 6, marginBottom: 8 },
			numInput: { flex: 1, minWidth: 0, boxSizing: "border-box", padding: "6px 8px", fontSize: 13, borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.15))", background: "var(--dsw-alias-fill-l1, transparent)", color: "var(--dsw-alias-label-primary, #1f2328)", textAlign: "center" },
			input: { width: "100%", boxSizing: "border-box", marginBottom: 8, padding: "6px 8px", fontSize: 13, borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2, rgba(0,0,0,0.15))", background: "var(--dsw-alias-fill-l1, transparent)", color: "var(--dsw-alias-label-primary, #1f2328)" },
			button: { width: "100%", padding: "7px 0", fontSize: 13, fontWeight: 600, borderRadius: 8, border: 0, background: "var(--dsw-accent, #4f6ef7)", color: "#fff", cursor: "pointer" },
			result: { marginTop: 12, fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" },
			err: { marginTop: 8, fontSize: 12, color: "var(--dsw-alias-danger, #e5484d)" },
			hint: { fontSize: 11, color: "var(--dsw-alias-label-tertiary, #8c959f)", marginTop: 8 }
		};

		// ============ 组件 ============
		function el(type, props) {
			var args = [type, props || null];
			for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
			return react.createElement.apply(null, args);
		}

		function XiaoliurenWidget() {
			var _s = react.useState(false);
			var open = _s[0];
			var setOpen = _s[1];
			var _m = react.useState("time");
			var mode = _m[0];
			var setMode = _m[1];
			var _n = react.useState(["", "", ""]);
			var nums = _n[0];
			var setNums = _n[1];
			var _q = react.useState("");
			var question = _q[0];
			var setQuestion = _q[1];
			var _r = react.useState(null);
			var result = _r[0];
			var setResult = _r[1];
			var _e = react.useState("");
			var error = _e[0];
			var setError = _e[1];
			var rootRef = react.useRef(null);
			var triggerRef = react.useRef(null);

			react.useEffect(function () {
				if (!open) return undefined;
				function closeOutside(event) {
					if (event.target instanceof Node && rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
				}
				document.addEventListener("pointerdown", closeOutside);
				return function () { document.removeEventListener("pointerdown", closeOutside); };
			}, [open]);

			react.useEffect(function () {
				if (!open) return undefined;
				function onKeyDown(event) {
					if (event.key === "Escape") { setOpen(false); if (triggerRef.current) triggerRef.current.focus(); }
				}
				document.addEventListener("keydown", onKeyDown);
				return function () { document.removeEventListener("keydown", onKeyDown); };
			}, [open]);

			function setNumAt(i, v) {
				var next = nums.slice();
				next[i] = v;
				setNums(next);
			}

			function pickMode(next) {
				setMode(next);
				setResult(null);
				setError("");
			}

			function generate() {
				setError("");
				setResult(null);
				try {
					var r;
					var castLine = "";
					var now = new Date();
					if (mode === "numbers") {
						var filled = nums.map(function (x) { return x.trim(); }).filter(function (x) { return x !== ""; });
						if (filled.length === 0) throw new Error("请至少输入一个数字");
						if (filled.length > 3) throw new Error("最多输入 3 个数字");
						var ns = filled.map(function (x) {
							var n = Number(x);
							if (!Number.isInteger(n) || n <= 0) throw new Error("数字必须是正整数");
							return n;
						});
						r = castNumbers(ns);
						castLine = "报数（" + r.steps[0].number + "·" + r.steps[1].number + "·" + r.steps[2].number + "）→ " + r.palace.name;
					} else if (mode === "time") {
						r = castTime(now);
						castLine = "时间（" + (now.getMonth() + 1) + "月" + now.getDate() + "日 " + shichenName(r.steps[2].number) + "时）→ " + r.palace.name;
					} else {
						r = castRandom();
						castLine = "随机（" + r.steps[0].number + "·" + r.steps[1].number + "·" + r.steps[2].number + "）→ " + r.palace.name;
					}
					var p = r.palace;
					setResult({
						mode: mode,
						question: question.trim() || null,
						castLine: castLine,
						steps: r.steps,
						result: { palace: p.name, index: p.index, auspicious: p.auspicious, verdict: p.verdict, advice: p.advice, wuxing: p.wuxing, direction: p.direction, shensha: p.shensha, verse: p.verse, interpretation: p.interpretation },
						disclaimer: DISCLAIMER
					});
				} catch (err) {
					setError(err && err.message ? err.message : String(err));
				}
			}

			return el("div", { ref: rootRef, style: css.root }, [
				el("button", {
					ref: triggerRef,
					type: "button",
					style: css.trigger,
					title: "小六壬占卜",
					"aria-label": "小六壬占卜",
					"aria-expanded": open,
					onClick: function () { setOpen(!open); }
				}, "卦"),
				open ? el("div", { style: css.panel, role: "dialog", "aria-label": "小六壬占卜" }, [
					el("div", { style: css.title }, "小六壬占卜"),
					el("div", { style: css.tabs }, [
						el("button", { type: "button", style: mode === "numbers" ? css.tabActive : css.tab, onClick: function () { pickMode("numbers"); } }, "数字"),
						el("button", { type: "button", style: mode === "time" ? css.tabActive : css.tab, onClick: function () { pickMode("time"); } }, "时间"),
						el("button", { type: "button", style: mode === "random" ? css.tabActive : css.tab, onClick: function () { pickMode("random"); } }, "随机")
					]),
					mode === "numbers" ? el("div", { style: css.numsRow }, [
						el("input", { type: "text", inputMode: "numeric", style: css.numInput, placeholder: "月", value: nums[0], onChange: function (e) { setNumAt(0, e.target.value); } }),
						el("input", { type: "text", inputMode: "numeric", style: css.numInput, placeholder: "日", value: nums[1], onChange: function (e) { setNumAt(1, e.target.value); } }),
						el("input", { type: "text", inputMode: "numeric", style: css.numInput, placeholder: "时", value: nums[2], onChange: function (e) { setNumAt(2, e.target.value); } })
					]) : null,
					el("input", { type: "text", style: css.input, placeholder: "所问之事（如：这个项目能否成功）", value: question, onChange: function (e) { setQuestion(e.target.value); } }),
					el("button", { type: "button", style: css.button, onClick: generate }, "生成答案"),
					error ? el("div", { style: css.err }, error) : null,
					result ? el("div", { style: css.result }, formatCard(result)) : null,
					el("div", { style: css.hint }, "起卦遵循小六壬传统数法；结果仅供传统文化娱乐参考。")
				]) : null
			]);
		}

		// ============ 插件（客户端 half，注册到会话头部 actions Slot） ============
		var inject = ["slots"];
		function apply(ctx) {
			ctx.slots.inject("conversation.session.header.actions", function () {
				return ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "xiaoliuren",
					order: 30
				}, XiaoliurenWidget);
			});
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
