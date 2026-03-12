import{cA as he,cB as Oe,cC as me,cD as ke,cE as ye,cF as Yt,cG as Ne,bJ as Et,bK as It,g as Pe,s as Ve,q as ze,p as He,a as Re,b as Be,_ as c,c as dt,d as Tt,cH as Ge,cI as Xe,cJ as je,e as qe,K as Ue,cK as j,l as ot,cL as ne,cM as ie,cN as Ze,cO as Ke,cP as Qe,cQ as Je,cR as tn,cS as en,cT as nn,cU as re,cV as se,cW as ae,cX as oe,cY as ce,k as rn,j as sn,y as an,u as on}from"./index-DUTlIOtC.js";const cn=Math.PI/180,ln=180/Math.PI,St=18,ge=.96422,pe=1,ve=.82521,be=4/29,ft=6/29,Te=3*ft*ft,un=ft*ft*ft;function xe(t){if(t instanceof et)return new et(t.l,t.a,t.b,t.opacity);if(t instanceof it)return we(t);t instanceof he||(t=Oe(t));var n=Wt(t.r),i=Wt(t.g),r=Wt(t.b),a=$t((.2225045*n+.7168786*i+.0606169*r)/pe),f,d;return n===i&&i===r?f=d=a:(f=$t((.4360747*n+.3850649*i+.1430804*r)/ge),d=$t((.0139322*n+.0971045*i+.7141733*r)/ve)),new et(116*a-16,500*(f-a),200*(a-d),t.opacity)}function dn(t,n,i,r){return arguments.length===1?xe(t):new et(t,n,i,r??1)}function et(t,n,i,r){this.l=+t,this.a=+n,this.b=+i,this.opacity=+r}me(et,dn,ke(ye,{brighter(t){return new et(this.l+St*(t??1),this.a,this.b,this.opacity)},darker(t){return new et(this.l-St*(t??1),this.a,this.b,this.opacity)},rgb(){var t=(this.l+16)/116,n=isNaN(this.a)?t:t+this.a/500,i=isNaN(this.b)?t:t-this.b/200;return n=ge*Ft(n),t=pe*Ft(t),i=ve*Ft(i),new he(Lt(3.1338561*n-1.6168667*t-.4906146*i),Lt(-.9787684*n+1.9161415*t+.033454*i),Lt(.0719453*n-.2289914*t+1.4052427*i),this.opacity)}}));function $t(t){return t>un?Math.pow(t,1/3):t/Te+be}function Ft(t){return t>ft?t*t*t:Te*(t-be)}function Lt(t){return 255*(t<=.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-.055)}function Wt(t){return(t/=255)<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)}function fn(t){if(t instanceof it)return new it(t.h,t.c,t.l,t.opacity);if(t instanceof et||(t=xe(t)),t.a===0&&t.b===0)return new it(NaN,0<t.l&&t.l<100?0:NaN,t.l,t.opacity);var n=Math.atan2(t.b,t.a)*ln;return new it(n<0?n+360:n,Math.sqrt(t.a*t.a+t.b*t.b),t.l,t.opacity)}function Pt(t,n,i,r){return arguments.length===1?fn(t):new it(t,n,i,r??1)}function it(t,n,i,r){this.h=+t,this.c=+n,this.l=+i,this.opacity=+r}function we(t){if(isNaN(t.h))return new et(t.l,0,0,t.opacity);var n=t.h*cn;return new et(t.l,Math.cos(n)*t.c,Math.sin(n)*t.c,t.opacity)}me(it,Pt,ke(ye,{brighter(t){return new it(this.h,this.c,this.l+St*(t??1),this.opacity)},darker(t){return new it(this.h,this.c,this.l-St*(t??1),this.opacity)},rgb(){return we(this).rgb()}}));function hn(t){return function(n,i){var r=t((n=Pt(n)).h,(i=Pt(i)).h),a=Yt(n.c,i.c),f=Yt(n.l,i.l),d=Yt(n.opacity,i.opacity);return function(T){return n.h=r(T),n.c=a(T),n.l=f(T),n.opacity=d(T),n+""}}}const mn=hn(Ne);function kn(t){return t}var wt=1,Ot=2,Vt=3,xt=4,le=1e-6;function yn(t){return"translate("+t+",0)"}function gn(t){return"translate(0,"+t+")"}function pn(t){return n=>+t(n)}function vn(t,n){return n=Math.max(0,t.bandwidth()-n*2)/2,t.round()&&(n=Math.round(n)),i=>+t(i)+n}function bn(){return!this.__axis}function _e(t,n){var i=[],r=null,a=null,f=6,d=6,T=3,E=typeof window<"u"&&window.devicePixelRatio>1?0:.5,Y=t===wt||t===xt?-1:1,x=t===xt||t===Ot?"x":"y",L=t===wt||t===Vt?yn:gn;function M(D){var z=r??(n.ticks?n.ticks.apply(n,i):n.domain()),I=a??(n.tickFormat?n.tickFormat.apply(n,i):kn),S=Math.max(f,0)+T,C=n.range(),O=+C[0]+E,F=+C[C.length-1]+E,H=(n.bandwidth?vn:pn)(n.copy(),E),R=D.selection?D.selection():D,A=R.selectAll(".domain").data([null]),p=R.selectAll(".tick").data(z,n).order(),h=p.exit(),u=p.enter().append("g").attr("class","tick"),b=p.select("line"),v=p.select("text");A=A.merge(A.enter().insert("path",".tick").attr("class","domain").attr("stroke","currentColor")),p=p.merge(u),b=b.merge(u.append("line").attr("stroke","currentColor").attr(x+"2",Y*f)),v=v.merge(u.append("text").attr("fill","currentColor").attr(x,Y*S).attr("dy",t===wt?"0em":t===Vt?"0.71em":"0.32em")),D!==R&&(A=A.transition(D),p=p.transition(D),b=b.transition(D),v=v.transition(D),h=h.transition(D).attr("opacity",le).attr("transform",function(k){return isFinite(k=H(k))?L(k+E):this.getAttribute("transform")}),u.attr("opacity",le).attr("transform",function(k){var m=this.parentNode.__axis;return L((m&&isFinite(m=m(k))?m:H(k))+E)})),h.remove(),A.attr("d",t===xt||t===Ot?d?"M"+Y*d+","+O+"H"+E+"V"+F+"H"+Y*d:"M"+E+","+O+"V"+F:d?"M"+O+","+Y*d+"V"+E+"H"+F+"V"+Y*d:"M"+O+","+E+"H"+F),p.attr("opacity",1).attr("transform",function(k){return L(H(k)+E)}),b.attr(x+"2",Y*f),v.attr(x,Y*S).text(I),R.filter(bn).attr("fill","none").attr("font-size",10).attr("font-family","sans-serif").attr("text-anchor",t===Ot?"start":t===xt?"end":"middle"),R.each(function(){this.__axis=H})}return M.scale=function(D){return arguments.length?(n=D,M):n},M.ticks=function(){return i=Array.from(arguments),M},M.tickArguments=function(D){return arguments.length?(i=D==null?[]:Array.from(D),M):i.slice()},M.tickValues=function(D){return arguments.length?(r=D==null?null:Array.from(D),M):r&&r.slice()},M.tickFormat=function(D){return arguments.length?(a=D,M):a},M.tickSize=function(D){return arguments.length?(f=d=+D,M):f},M.tickSizeInner=function(D){return arguments.length?(f=+D,M):f},M.tickSizeOuter=function(D){return arguments.length?(d=+D,M):d},M.tickPadding=function(D){return arguments.length?(T=+D,M):T},M.offset=function(D){return arguments.length?(E=+D,M):E},M}function Tn(t){return _e(wt,t)}function xn(t){return _e(Vt,t)}var De={exports:{}};(function(t,n){(function(i,r){t.exports=r()})(Et,function(){var i="day";return function(r,a,f){var d=function(Y){return Y.add(4-Y.isoWeekday(),i)},T=a.prototype;T.isoWeekYear=function(){return d(this).year()},T.isoWeek=function(Y){if(!this.$utils().u(Y))return this.add(7*(Y-this.isoWeek()),i);var x,L,M,D,z=d(this),I=(x=this.isoWeekYear(),L=this.$u,M=(L?f.utc:f)().year(x).startOf("year"),D=4-M.isoWeekday(),M.isoWeekday()>4&&(D+=7),M.add(D,i));return z.diff(I,"week")+1},T.isoWeekday=function(Y){return this.$utils().u(Y)?this.day()||7:this.day(this.day()%7?Y:Y-7)};var E=T.startOf;T.startOf=function(Y,x){var L=this.$utils(),M=!!L.u(x)||x;return L.p(Y)==="isoweek"?M?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):E.bind(this)(Y,x)}}})})(De);var wn=De.exports;const _n=It(wn);var Se={exports:{}};(function(t,n){(function(i,r){t.exports=r()})(Et,function(){var i={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},r=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,a=/\d/,f=/\d\d/,d=/\d\d?/,T=/\d*[^-_:/,()\s\d]+/,E={},Y=function(S){return(S=+S)+(S>68?1900:2e3)},x=function(S){return function(C){this[S]=+C}},L=[/[+-]\d\d:?(\d\d)?|Z/,function(S){(this.zone||(this.zone={})).offset=function(C){if(!C||C==="Z")return 0;var O=C.match(/([+-]|\d\d)/g),F=60*O[1]+(+O[2]||0);return F===0?0:O[0]==="+"?-F:F}(S)}],M=function(S){var C=E[S];return C&&(C.indexOf?C:C.s.concat(C.f))},D=function(S,C){var O,F=E.meridiem;if(F){for(var H=1;H<=24;H+=1)if(S.indexOf(F(H,0,C))>-1){O=H>12;break}}else O=S===(C?"pm":"PM");return O},z={A:[T,function(S){this.afternoon=D(S,!1)}],a:[T,function(S){this.afternoon=D(S,!0)}],Q:[a,function(S){this.month=3*(S-1)+1}],S:[a,function(S){this.milliseconds=100*+S}],SS:[f,function(S){this.milliseconds=10*+S}],SSS:[/\d{3}/,function(S){this.milliseconds=+S}],s:[d,x("seconds")],ss:[d,x("seconds")],m:[d,x("minutes")],mm:[d,x("minutes")],H:[d,x("hours")],h:[d,x("hours")],HH:[d,x("hours")],hh:[d,x("hours")],D:[d,x("day")],DD:[f,x("day")],Do:[T,function(S){var C=E.ordinal,O=S.match(/\d+/);if(this.day=O[0],C)for(var F=1;F<=31;F+=1)C(F).replace(/\[|\]/g,"")===S&&(this.day=F)}],w:[d,x("week")],ww:[f,x("week")],M:[d,x("month")],MM:[f,x("month")],MMM:[T,function(S){var C=M("months"),O=(M("monthsShort")||C.map(function(F){return F.slice(0,3)})).indexOf(S)+1;if(O<1)throw new Error;this.month=O%12||O}],MMMM:[T,function(S){var C=M("months").indexOf(S)+1;if(C<1)throw new Error;this.month=C%12||C}],Y:[/[+-]?\d+/,x("year")],YY:[f,function(S){this.year=Y(S)}],YYYY:[/\d{4}/,x("year")],Z:L,ZZ:L};function I(S){var C,O;C=S,O=E&&E.formats;for(var F=(S=C.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(b,v,k){var m=k&&k.toUpperCase();return v||O[k]||i[k]||O[m].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(o,l,y){return l||y.slice(1)})})).match(r),H=F.length,R=0;R<H;R+=1){var A=F[R],p=z[A],h=p&&p[0],u=p&&p[1];F[R]=u?{regex:h,parser:u}:A.replace(/^\[|\]$/g,"")}return function(b){for(var v={},k=0,m=0;k<H;k+=1){var o=F[k];if(typeof o=="string")m+=o.length;else{var l=o.regex,y=o.parser,g=b.slice(m),w=l.exec(g)[0];y.call(v,w),b=b.replace(w,"")}}return function(s){var V=s.afternoon;if(V!==void 0){var e=s.hours;V?e<12&&(s.hours+=12):e===12&&(s.hours=0),delete s.afternoon}}(v),v}}return function(S,C,O){O.p.customParseFormat=!0,S&&S.parseTwoDigitYear&&(Y=S.parseTwoDigitYear);var F=C.prototype,H=F.parse;F.parse=function(R){var A=R.date,p=R.utc,h=R.args;this.$u=p;var u=h[1];if(typeof u=="string"){var b=h[2]===!0,v=h[3]===!0,k=b||v,m=h[2];v&&(m=h[2]),E=this.$locale(),!b&&m&&(E=O.Ls[m]),this.$d=function(g,w,s,V){try{if(["x","X"].indexOf(w)>-1)return new Date((w==="X"?1e3:1)*g);var e=I(w)(g),_=e.year,P=e.month,N=e.day,W=e.hours,X=e.minutes,$=e.seconds,K=e.milliseconds,rt=e.zone,lt=e.week,kt=new Date,yt=N||(_||P?1:kt.getDate()),ut=_||kt.getFullYear(),B=0;_&&!P||(B=P>0?P-1:kt.getMonth());var Z,q=W||0,at=X||0,Q=$||0,st=K||0;return rt?new Date(Date.UTC(ut,B,yt,q,at,Q,st+60*rt.offset*1e3)):s?new Date(Date.UTC(ut,B,yt,q,at,Q,st)):(Z=new Date(ut,B,yt,q,at,Q,st),lt&&(Z=V(Z).week(lt).toDate()),Z)}catch{return new Date("")}}(A,u,p,O),this.init(),m&&m!==!0&&(this.$L=this.locale(m).$L),k&&A!=this.format(u)&&(this.$d=new Date("")),E={}}else if(u instanceof Array)for(var o=u.length,l=1;l<=o;l+=1){h[1]=u[l-1];var y=O.apply(this,h);if(y.isValid()){this.$d=y.$d,this.$L=y.$L,this.init();break}l===o&&(this.$d=new Date(""))}else H.call(this,R)}}})})(Se);var Dn=Se.exports;const Sn=It(Dn);var Me={exports:{}};(function(t,n){(function(i,r){t.exports=r()})(Et,function(){return function(i,r){var a=r.prototype,f=a.format;a.format=function(d){var T=this,E=this.$locale();if(!this.isValid())return f.bind(this)(d);var Y=this.$utils(),x=(d||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(L){switch(L){case"Q":return Math.ceil((T.$M+1)/3);case"Do":return E.ordinal(T.$D);case"gggg":return T.weekYear();case"GGGG":return T.isoWeekYear();case"wo":return E.ordinal(T.week(),"W");case"w":case"ww":return Y.s(T.week(),L==="w"?1:2,"0");case"W":case"WW":return Y.s(T.isoWeek(),L==="W"?1:2,"0");case"k":case"kk":return Y.s(String(T.$H===0?24:T.$H),L==="k"?1:2,"0");case"X":return Math.floor(T.$d.getTime()/1e3);case"x":return T.$d.getTime();case"z":return"["+T.offsetName()+"]";case"zzz":return"["+T.offsetName("long")+"]";default:return L}});return f.bind(this)(x)}}})})(Me);var Mn=Me.exports;const Cn=It(Mn);var Ce={exports:{}};(function(t,n){(function(i,r){t.exports=r()})(Et,function(){var i,r,a=1e3,f=6e4,d=36e5,T=864e5,E=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,Y=31536e6,x=2628e6,L=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,M={years:Y,months:x,days:T,hours:d,minutes:f,seconds:a,milliseconds:1,weeks:6048e5},D=function(A){return A instanceof H},z=function(A,p,h){return new H(A,h,p.$l)},I=function(A){return r.p(A)+"s"},S=function(A){return A<0},C=function(A){return S(A)?Math.ceil(A):Math.floor(A)},O=function(A){return Math.abs(A)},F=function(A,p){return A?S(A)?{negative:!0,format:""+O(A)+p}:{negative:!1,format:""+A+p}:{negative:!1,format:""}},H=function(){function A(h,u,b){var v=this;if(this.$d={},this.$l=b,h===void 0&&(this.$ms=0,this.parseFromMilliseconds()),u)return z(h*M[I(u)],this);if(typeof h=="number")return this.$ms=h,this.parseFromMilliseconds(),this;if(typeof h=="object")return Object.keys(h).forEach(function(o){v.$d[I(o)]=h[o]}),this.calMilliseconds(),this;if(typeof h=="string"){var k=h.match(L);if(k){var m=k.slice(2).map(function(o){return o!=null?Number(o):0});return this.$d.years=m[0],this.$d.months=m[1],this.$d.weeks=m[2],this.$d.days=m[3],this.$d.hours=m[4],this.$d.minutes=m[5],this.$d.seconds=m[6],this.calMilliseconds(),this}}return this}var p=A.prototype;return p.calMilliseconds=function(){var h=this;this.$ms=Object.keys(this.$d).reduce(function(u,b){return u+(h.$d[b]||0)*M[b]},0)},p.parseFromMilliseconds=function(){var h=this.$ms;this.$d.years=C(h/Y),h%=Y,this.$d.months=C(h/x),h%=x,this.$d.days=C(h/T),h%=T,this.$d.hours=C(h/d),h%=d,this.$d.minutes=C(h/f),h%=f,this.$d.seconds=C(h/a),h%=a,this.$d.milliseconds=h},p.toISOString=function(){var h=F(this.$d.years,"Y"),u=F(this.$d.months,"M"),b=+this.$d.days||0;this.$d.weeks&&(b+=7*this.$d.weeks);var v=F(b,"D"),k=F(this.$d.hours,"H"),m=F(this.$d.minutes,"M"),o=this.$d.seconds||0;this.$d.milliseconds&&(o+=this.$d.milliseconds/1e3,o=Math.round(1e3*o)/1e3);var l=F(o,"S"),y=h.negative||u.negative||v.negative||k.negative||m.negative||l.negative,g=k.format||m.format||l.format?"T":"",w=(y?"-":"")+"P"+h.format+u.format+v.format+g+k.format+m.format+l.format;return w==="P"||w==="-P"?"P0D":w},p.toJSON=function(){return this.toISOString()},p.format=function(h){var u=h||"YYYY-MM-DDTHH:mm:ss",b={Y:this.$d.years,YY:r.s(this.$d.years,2,"0"),YYYY:r.s(this.$d.years,4,"0"),M:this.$d.months,MM:r.s(this.$d.months,2,"0"),D:this.$d.days,DD:r.s(this.$d.days,2,"0"),H:this.$d.hours,HH:r.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:r.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:r.s(this.$d.seconds,2,"0"),SSS:r.s(this.$d.milliseconds,3,"0")};return u.replace(E,function(v,k){return k||String(b[v])})},p.as=function(h){return this.$ms/M[I(h)]},p.get=function(h){var u=this.$ms,b=I(h);return b==="milliseconds"?u%=1e3:u=b==="weeks"?C(u/M[b]):this.$d[b],u||0},p.add=function(h,u,b){var v;return v=u?h*M[I(u)]:D(h)?h.$ms:z(h,this).$ms,z(this.$ms+v*(b?-1:1),this)},p.subtract=function(h,u){return this.add(h,u,!0)},p.locale=function(h){var u=this.clone();return u.$l=h,u},p.clone=function(){return z(this.$ms,this)},p.humanize=function(h){return i().add(this.$ms,"ms").locale(this.$l).fromNow(!h)},p.valueOf=function(){return this.asMilliseconds()},p.milliseconds=function(){return this.get("milliseconds")},p.asMilliseconds=function(){return this.as("milliseconds")},p.seconds=function(){return this.get("seconds")},p.asSeconds=function(){return this.as("seconds")},p.minutes=function(){return this.get("minutes")},p.asMinutes=function(){return this.as("minutes")},p.hours=function(){return this.get("hours")},p.asHours=function(){return this.as("hours")},p.days=function(){return this.get("days")},p.asDays=function(){return this.as("days")},p.weeks=function(){return this.get("weeks")},p.asWeeks=function(){return this.as("weeks")},p.months=function(){return this.get("months")},p.asMonths=function(){return this.as("months")},p.years=function(){return this.get("years")},p.asYears=function(){return this.as("years")},A}(),R=function(A,p,h){return A.add(p.years()*h,"y").add(p.months()*h,"M").add(p.days()*h,"d").add(p.hours()*h,"h").add(p.minutes()*h,"m").add(p.seconds()*h,"s").add(p.milliseconds()*h,"ms")};return function(A,p,h){i=h,r=h().$utils(),h.duration=function(v,k){var m=h.locale();return z(v,{$l:m},k)},h.isDuration=D;var u=p.prototype.add,b=p.prototype.subtract;p.prototype.add=function(v,k){return D(v)?R(this,v,1):u.bind(this)(v,k)},p.prototype.subtract=function(v,k){return D(v)?R(this,v,-1):b.bind(this)(v,k)}}})})(Ce);var En=Ce.exports;const In=It(En);var zt=function(){var t=c(function(m,o,l,y){for(l=l||{},y=m.length;y--;l[m[y]]=o);return l},"o"),n=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],i=[1,26],r=[1,27],a=[1,28],f=[1,29],d=[1,30],T=[1,31],E=[1,32],Y=[1,33],x=[1,34],L=[1,9],M=[1,10],D=[1,11],z=[1,12],I=[1,13],S=[1,14],C=[1,15],O=[1,16],F=[1,19],H=[1,20],R=[1,21],A=[1,22],p=[1,23],h=[1,25],u=[1,35],b={trace:c(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:c(function(o,l,y,g,w,s,V){var e=s.length-1;switch(w){case 1:return s[e-1];case 2:this.$=[];break;case 3:s[e-1].push(s[e]),this.$=s[e-1];break;case 4:case 5:this.$=s[e];break;case 6:case 7:this.$=[];break;case 8:g.setWeekday("monday");break;case 9:g.setWeekday("tuesday");break;case 10:g.setWeekday("wednesday");break;case 11:g.setWeekday("thursday");break;case 12:g.setWeekday("friday");break;case 13:g.setWeekday("saturday");break;case 14:g.setWeekday("sunday");break;case 15:g.setWeekend("friday");break;case 16:g.setWeekend("saturday");break;case 17:g.setDateFormat(s[e].substr(11)),this.$=s[e].substr(11);break;case 18:g.enableInclusiveEndDates(),this.$=s[e].substr(18);break;case 19:g.TopAxis(),this.$=s[e].substr(8);break;case 20:g.setAxisFormat(s[e].substr(11)),this.$=s[e].substr(11);break;case 21:g.setTickInterval(s[e].substr(13)),this.$=s[e].substr(13);break;case 22:g.setExcludes(s[e].substr(9)),this.$=s[e].substr(9);break;case 23:g.setIncludes(s[e].substr(9)),this.$=s[e].substr(9);break;case 24:g.setTodayMarker(s[e].substr(12)),this.$=s[e].substr(12);break;case 27:g.setDiagramTitle(s[e].substr(6)),this.$=s[e].substr(6);break;case 28:this.$=s[e].trim(),g.setAccTitle(this.$);break;case 29:case 30:this.$=s[e].trim(),g.setAccDescription(this.$);break;case 31:g.addSection(s[e].substr(8)),this.$=s[e].substr(8);break;case 33:g.addTask(s[e-1],s[e]),this.$="task";break;case 34:this.$=s[e-1],g.setClickEvent(s[e-1],s[e],null);break;case 35:this.$=s[e-2],g.setClickEvent(s[e-2],s[e-1],s[e]);break;case 36:this.$=s[e-2],g.setClickEvent(s[e-2],s[e-1],null),g.setLink(s[e-2],s[e]);break;case 37:this.$=s[e-3],g.setClickEvent(s[e-3],s[e-2],s[e-1]),g.setLink(s[e-3],s[e]);break;case 38:this.$=s[e-2],g.setClickEvent(s[e-2],s[e],null),g.setLink(s[e-2],s[e-1]);break;case 39:this.$=s[e-3],g.setClickEvent(s[e-3],s[e-1],s[e]),g.setLink(s[e-3],s[e-2]);break;case 40:this.$=s[e-1],g.setLink(s[e-1],s[e]);break;case 41:case 47:this.$=s[e-1]+" "+s[e];break;case 42:case 43:case 45:this.$=s[e-2]+" "+s[e-1]+" "+s[e];break;case 44:case 46:this.$=s[e-3]+" "+s[e-2]+" "+s[e-1]+" "+s[e];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(n,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:i,13:r,14:a,15:f,16:d,17:T,18:E,19:18,20:Y,21:x,22:L,23:M,24:D,25:z,26:I,27:S,28:C,29:O,30:F,31:H,33:R,35:A,36:p,37:24,38:h,40:u},t(n,[2,7],{1:[2,1]}),t(n,[2,3]),{9:36,11:17,12:i,13:r,14:a,15:f,16:d,17:T,18:E,19:18,20:Y,21:x,22:L,23:M,24:D,25:z,26:I,27:S,28:C,29:O,30:F,31:H,33:R,35:A,36:p,37:24,38:h,40:u},t(n,[2,5]),t(n,[2,6]),t(n,[2,17]),t(n,[2,18]),t(n,[2,19]),t(n,[2,20]),t(n,[2,21]),t(n,[2,22]),t(n,[2,23]),t(n,[2,24]),t(n,[2,25]),t(n,[2,26]),t(n,[2,27]),{32:[1,37]},{34:[1,38]},t(n,[2,30]),t(n,[2,31]),t(n,[2,32]),{39:[1,39]},t(n,[2,8]),t(n,[2,9]),t(n,[2,10]),t(n,[2,11]),t(n,[2,12]),t(n,[2,13]),t(n,[2,14]),t(n,[2,15]),t(n,[2,16]),{41:[1,40],43:[1,41]},t(n,[2,4]),t(n,[2,28]),t(n,[2,29]),t(n,[2,33]),t(n,[2,34],{42:[1,42],43:[1,43]}),t(n,[2,40],{41:[1,44]}),t(n,[2,35],{43:[1,45]}),t(n,[2,36]),t(n,[2,38],{42:[1,46]}),t(n,[2,37]),t(n,[2,39])],defaultActions:{},parseError:c(function(o,l){if(l.recoverable)this.trace(o);else{var y=new Error(o);throw y.hash=l,y}},"parseError"),parse:c(function(o){var l=this,y=[0],g=[],w=[null],s=[],V=this.table,e="",_=0,P=0,N=2,W=1,X=s.slice.call(arguments,1),$=Object.create(this.lexer),K={yy:{}};for(var rt in this.yy)Object.prototype.hasOwnProperty.call(this.yy,rt)&&(K.yy[rt]=this.yy[rt]);$.setInput(o,K.yy),K.yy.lexer=$,K.yy.parser=this,typeof $.yylloc>"u"&&($.yylloc={});var lt=$.yylloc;s.push(lt);var kt=$.options&&$.options.ranges;typeof K.yy.parseError=="function"?this.parseError=K.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function yt(U){y.length=y.length-2*U,w.length=w.length-U,s.length=s.length-U}c(yt,"popStack");function ut(){var U;return U=g.pop()||$.lex()||W,typeof U!="number"&&(U instanceof Array&&(g=U,U=g.pop()),U=l.symbols_[U]||U),U}c(ut,"lex");for(var B,Z,q,at,Q={},st,J,ee,bt;;){if(Z=y[y.length-1],this.defaultActions[Z]?q=this.defaultActions[Z]:((B===null||typeof B>"u")&&(B=ut()),q=V[Z]&&V[Z][B]),typeof q>"u"||!q.length||!q[0]){var At="";bt=[];for(st in V[Z])this.terminals_[st]&&st>N&&bt.push("'"+this.terminals_[st]+"'");$.showPosition?At="Parse error on line "+(_+1)+`:
`+$.showPosition()+`
Expecting `+bt.join(", ")+", got '"+(this.terminals_[B]||B)+"'":At="Parse error on line "+(_+1)+": Unexpected "+(B==W?"end of input":"'"+(this.terminals_[B]||B)+"'"),this.parseError(At,{text:$.match,token:this.terminals_[B]||B,line:$.yylineno,loc:lt,expected:bt})}if(q[0]instanceof Array&&q.length>1)throw new Error("Parse Error: multiple actions possible at state: "+Z+", token: "+B);switch(q[0]){case 1:y.push(B),w.push($.yytext),s.push($.yylloc),y.push(q[1]),B=null,P=$.yyleng,e=$.yytext,_=$.yylineno,lt=$.yylloc;break;case 2:if(J=this.productions_[q[1]][1],Q.$=w[w.length-J],Q._$={first_line:s[s.length-(J||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(J||1)].first_column,last_column:s[s.length-1].last_column},kt&&(Q._$.range=[s[s.length-(J||1)].range[0],s[s.length-1].range[1]]),at=this.performAction.apply(Q,[e,P,_,K.yy,q[1],w,s].concat(X)),typeof at<"u")return at;J&&(y=y.slice(0,-1*J*2),w=w.slice(0,-1*J),s=s.slice(0,-1*J)),y.push(this.productions_[q[1]][0]),w.push(Q.$),s.push(Q._$),ee=V[y[y.length-2]][y[y.length-1]],y.push(ee);break;case 3:return!0}}return!0},"parse")},v=function(){var m={EOF:1,parseError:c(function(l,y){if(this.yy.parser)this.yy.parser.parseError(l,y);else throw new Error(l)},"parseError"),setInput:c(function(o,l){return this.yy=l||this.yy||{},this._input=o,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:c(function(){var o=this._input[0];this.yytext+=o,this.yyleng++,this.offset++,this.match+=o,this.matched+=o;var l=o.match(/(?:\r\n?|\n).*/g);return l?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),o},"input"),unput:c(function(o){var l=o.length,y=o.split(/(?:\r\n?|\n)/g);this._input=o+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-l),this.offset-=l;var g=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),y.length-1&&(this.yylineno-=y.length-1);var w=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:y?(y.length===g.length?this.yylloc.first_column:0)+g[g.length-y.length].length-y[0].length:this.yylloc.first_column-l},this.options.ranges&&(this.yylloc.range=[w[0],w[0]+this.yyleng-l]),this.yyleng=this.yytext.length,this},"unput"),more:c(function(){return this._more=!0,this},"more"),reject:c(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:c(function(o){this.unput(this.match.slice(o))},"less"),pastInput:c(function(){var o=this.matched.substr(0,this.matched.length-this.match.length);return(o.length>20?"...":"")+o.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:c(function(){var o=this.match;return o.length<20&&(o+=this._input.substr(0,20-o.length)),(o.substr(0,20)+(o.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:c(function(){var o=this.pastInput(),l=new Array(o.length+1).join("-");return o+this.upcomingInput()+`
`+l+"^"},"showPosition"),test_match:c(function(o,l){var y,g,w;if(this.options.backtrack_lexer&&(w={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(w.yylloc.range=this.yylloc.range.slice(0))),g=o[0].match(/(?:\r\n?|\n).*/g),g&&(this.yylineno+=g.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:g?g[g.length-1].length-g[g.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+o[0].length},this.yytext+=o[0],this.match+=o[0],this.matches=o,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(o[0].length),this.matched+=o[0],y=this.performAction.call(this,this.yy,this,l,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),y)return y;if(this._backtrack){for(var s in w)this[s]=w[s];return!1}return!1},"test_match"),next:c(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var o,l,y,g;this._more||(this.yytext="",this.match="");for(var w=this._currentRules(),s=0;s<w.length;s++)if(y=this._input.match(this.rules[w[s]]),y&&(!l||y[0].length>l[0].length)){if(l=y,g=s,this.options.backtrack_lexer){if(o=this.test_match(y,w[s]),o!==!1)return o;if(this._backtrack){l=!1;continue}else return!1}else if(!this.options.flex)break}return l?(o=this.test_match(l,w[g]),o!==!1?o:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:c(function(){var l=this.next();return l||this.lex()},"lex"),begin:c(function(l){this.conditionStack.push(l)},"begin"),popState:c(function(){var l=this.conditionStack.length-1;return l>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:c(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:c(function(l){return l=this.conditionStack.length-1-Math.abs(l||0),l>=0?this.conditionStack[l]:"INITIAL"},"topState"),pushState:c(function(l){this.begin(l)},"pushState"),stateStackSize:c(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:c(function(l,y,g,w){switch(g){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return m}();b.lexer=v;function k(){this.yy={}}return c(k,"Parser"),k.prototype=b,b.Parser=k,new k}();zt.parser=zt;var An=zt;j.extend(_n);j.extend(Sn);j.extend(Cn);var ue={friday:5,saturday:6},tt="",Gt="",Xt=void 0,jt="",gt=[],pt=[],qt=new Map,Ut=[],Mt=[],mt="",Zt="",Ee=["active","done","crit","milestone","vert"],Kt=[],vt=!1,Qt=!1,Jt="sunday",Ct="saturday",Ht=0,Yn=c(function(){Ut=[],Mt=[],mt="",Kt=[],_t=0,Bt=void 0,Dt=void 0,G=[],tt="",Gt="",Zt="",Xt=void 0,jt="",gt=[],pt=[],vt=!1,Qt=!1,Ht=0,qt=new Map,an(),Jt="sunday",Ct="saturday"},"clear"),$n=c(function(t){Gt=t},"setAxisFormat"),Fn=c(function(){return Gt},"getAxisFormat"),Ln=c(function(t){Xt=t},"setTickInterval"),Wn=c(function(){return Xt},"getTickInterval"),On=c(function(t){jt=t},"setTodayMarker"),Nn=c(function(){return jt},"getTodayMarker"),Pn=c(function(t){tt=t},"setDateFormat"),Vn=c(function(){vt=!0},"enableInclusiveEndDates"),zn=c(function(){return vt},"endDatesAreInclusive"),Hn=c(function(){Qt=!0},"enableTopAxis"),Rn=c(function(){return Qt},"topAxisEnabled"),Bn=c(function(t){Zt=t},"setDisplayMode"),Gn=c(function(){return Zt},"getDisplayMode"),Xn=c(function(){return tt},"getDateFormat"),jn=c(function(t){gt=t.toLowerCase().split(/[\s,]+/)},"setIncludes"),qn=c(function(){return gt},"getIncludes"),Un=c(function(t){pt=t.toLowerCase().split(/[\s,]+/)},"setExcludes"),Zn=c(function(){return pt},"getExcludes"),Kn=c(function(){return qt},"getLinks"),Qn=c(function(t){mt=t,Ut.push(t)},"addSection"),Jn=c(function(){return Ut},"getSections"),ti=c(function(){let t=de();const n=10;let i=0;for(;!t&&i<n;)t=de(),i++;return Mt=G,Mt},"getTasks"),Ie=c(function(t,n,i,r){const a=t.format(n.trim()),f=t.format("YYYY-MM-DD");return r.includes(a)||r.includes(f)?!1:i.includes("weekends")&&(t.isoWeekday()===ue[Ct]||t.isoWeekday()===ue[Ct]+1)||i.includes(t.format("dddd").toLowerCase())?!0:i.includes(a)||i.includes(f)},"isInvalidDate"),ei=c(function(t){Jt=t},"setWeekday"),ni=c(function(){return Jt},"getWeekday"),ii=c(function(t){Ct=t},"setWeekend"),Ae=c(function(t,n,i,r){if(!i.length||t.manualEndTime)return;let a;t.startTime instanceof Date?a=j(t.startTime):a=j(t.startTime,n,!0),a=a.add(1,"d");let f;t.endTime instanceof Date?f=j(t.endTime):f=j(t.endTime,n,!0);const[d,T]=ri(a,f,n,i,r);t.endTime=d.toDate(),t.renderEndTime=T},"checkTaskDates"),ri=c(function(t,n,i,r,a){let f=!1,d=null;for(;t<=n;)f||(d=n.toDate()),f=Ie(t,i,r,a),f&&(n=n.add(1,"d")),t=t.add(1,"d");return[n,d]},"fixTaskDates"),Rt=c(function(t,n,i){if(i=i.trim(),c(T=>{const E=T.trim();return E==="x"||E==="X"},"isTimestampFormat")(n)&&/^\d+$/.test(i))return new Date(Number(i));const f=/^after\s+(?<ids>[\d\w- ]+)/.exec(i);if(f!==null){let T=null;for(const Y of f.groups.ids.split(" ")){let x=ct(Y);x!==void 0&&(!T||x.endTime>T.endTime)&&(T=x)}if(T)return T.endTime;const E=new Date;return E.setHours(0,0,0,0),E}let d=j(i,n.trim(),!0);if(d.isValid())return d.toDate();{ot.debug("Invalid date:"+i),ot.debug("With date format:"+n.trim());const T=new Date(i);if(T===void 0||isNaN(T.getTime())||T.getFullYear()<-1e4||T.getFullYear()>1e4)throw new Error("Invalid date:"+i);return T}},"getStartDate"),Ye=c(function(t){const n=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return n!==null?[Number.parseFloat(n[1]),n[2]]:[NaN,"ms"]},"parseDuration"),$e=c(function(t,n,i,r=!1){i=i.trim();const f=/^until\s+(?<ids>[\d\w- ]+)/.exec(i);if(f!==null){let x=null;for(const M of f.groups.ids.split(" ")){let D=ct(M);D!==void 0&&(!x||D.startTime<x.startTime)&&(x=D)}if(x)return x.startTime;const L=new Date;return L.setHours(0,0,0,0),L}let d=j(i,n.trim(),!0);if(d.isValid())return r&&(d=d.add(1,"d")),d.toDate();let T=j(t);const[E,Y]=Ye(i);if(!Number.isNaN(E)){const x=T.add(E,Y);x.isValid()&&(T=x)}return T.toDate()},"getEndDate"),_t=0,ht=c(function(t){return t===void 0?(_t=_t+1,"task"+_t):t},"parseId"),si=c(function(t,n){let i;n.substr(0,1)===":"?i=n.substr(1,n.length):i=n;const r=i.split(","),a={};te(r,a,Ee);for(let d=0;d<r.length;d++)r[d]=r[d].trim();let f="";switch(r.length){case 1:a.id=ht(),a.startTime=t.endTime,f=r[0];break;case 2:a.id=ht(),a.startTime=Rt(void 0,tt,r[0]),f=r[1];break;case 3:a.id=ht(r[0]),a.startTime=Rt(void 0,tt,r[1]),f=r[2];break}return f&&(a.endTime=$e(a.startTime,tt,f,vt),a.manualEndTime=j(f,"YYYY-MM-DD",!0).isValid(),Ae(a,tt,pt,gt)),a},"compileData"),ai=c(function(t,n){let i;n.substr(0,1)===":"?i=n.substr(1,n.length):i=n;const r=i.split(","),a={};te(r,a,Ee);for(let f=0;f<r.length;f++)r[f]=r[f].trim();switch(r.length){case 1:a.id=ht(),a.startTime={type:"prevTaskEnd",id:t},a.endTime={data:r[0]};break;case 2:a.id=ht(),a.startTime={type:"getStartDate",startData:r[0]},a.endTime={data:r[1]};break;case 3:a.id=ht(r[0]),a.startTime={type:"getStartDate",startData:r[1]},a.endTime={data:r[2]};break}return a},"parseData"),Bt,Dt,G=[],Fe={},oi=c(function(t,n){const i={section:mt,type:mt,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:n},task:t,classes:[]},r=ai(Dt,n);i.raw.startTime=r.startTime,i.raw.endTime=r.endTime,i.id=r.id,i.prevTaskId=Dt,i.active=r.active,i.done=r.done,i.crit=r.crit,i.milestone=r.milestone,i.vert=r.vert,i.order=Ht,Ht++;const a=G.push(i);Dt=i.id,Fe[i.id]=a-1},"addTask"),ct=c(function(t){const n=Fe[t];return G[n]},"findTaskById"),ci=c(function(t,n){const i={section:mt,type:mt,description:t,task:t,classes:[]},r=si(Bt,n);i.startTime=r.startTime,i.endTime=r.endTime,i.id=r.id,i.active=r.active,i.done=r.done,i.crit=r.crit,i.milestone=r.milestone,i.vert=r.vert,Bt=i,Mt.push(i)},"addTaskOrg"),de=c(function(){const t=c(function(i){const r=G[i];let a="";switch(G[i].raw.startTime.type){case"prevTaskEnd":{const f=ct(r.prevTaskId);r.startTime=f.endTime;break}case"getStartDate":a=Rt(void 0,tt,G[i].raw.startTime.startData),a&&(G[i].startTime=a);break}return G[i].startTime&&(G[i].endTime=$e(G[i].startTime,tt,G[i].raw.endTime.data,vt),G[i].endTime&&(G[i].processed=!0,G[i].manualEndTime=j(G[i].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),Ae(G[i],tt,pt,gt))),G[i].processed},"compileTask");let n=!0;for(const[i,r]of G.entries())t(i),n=n&&r.processed;return n},"compileTasks"),li=c(function(t,n){let i=n;dt().securityLevel!=="loose"&&(i=sn(n)),t.split(",").forEach(function(r){ct(r)!==void 0&&(We(r,()=>{window.open(i,"_self")}),qt.set(r,i))}),Le(t,"clickable")},"setLink"),Le=c(function(t,n){t.split(",").forEach(function(i){let r=ct(i);r!==void 0&&r.classes.push(n)})},"setClass"),ui=c(function(t,n,i){if(dt().securityLevel!=="loose"||n===void 0)return;let r=[];if(typeof i=="string"){r=i.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let f=0;f<r.length;f++){let d=r[f].trim();d.startsWith('"')&&d.endsWith('"')&&(d=d.substr(1,d.length-2)),r[f]=d}}r.length===0&&r.push(t),ct(t)!==void 0&&We(t,()=>{on.runFunc(n,...r)})},"setClickFun"),We=c(function(t,n){Kt.push(function(){const i=document.querySelector(`[id="${t}"]`);i!==null&&i.addEventListener("click",function(){n()})},function(){const i=document.querySelector(`[id="${t}-text"]`);i!==null&&i.addEventListener("click",function(){n()})})},"pushFun"),di=c(function(t,n,i){t.split(",").forEach(function(r){ui(r,n,i)}),Le(t,"clickable")},"setClickEvent"),fi=c(function(t){Kt.forEach(function(n){n(t)})},"bindFunctions"),hi={getConfig:c(()=>dt().gantt,"getConfig"),clear:Yn,setDateFormat:Pn,getDateFormat:Xn,enableInclusiveEndDates:Vn,endDatesAreInclusive:zn,enableTopAxis:Hn,topAxisEnabled:Rn,setAxisFormat:$n,getAxisFormat:Fn,setTickInterval:Ln,getTickInterval:Wn,setTodayMarker:On,getTodayMarker:Nn,setAccTitle:Be,getAccTitle:Re,setDiagramTitle:He,getDiagramTitle:ze,setDisplayMode:Bn,getDisplayMode:Gn,setAccDescription:Ve,getAccDescription:Pe,addSection:Qn,getSections:Jn,getTasks:ti,addTask:oi,findTaskById:ct,addTaskOrg:ci,setIncludes:jn,getIncludes:qn,setExcludes:Un,getExcludes:Zn,setClickEvent:di,setLink:li,getLinks:Kn,bindFunctions:fi,parseDuration:Ye,isInvalidDate:Ie,setWeekday:ei,getWeekday:ni,setWeekend:ii};function te(t,n,i){let r=!0;for(;r;)r=!1,i.forEach(function(a){const f="^\\s*"+a+"\\s*$",d=new RegExp(f);t[0].match(d)&&(n[a]=!0,t.shift(1),r=!0)})}c(te,"getTaskTags");j.extend(In);var mi=c(function(){ot.debug("Something is calling, setConf, remove the call")},"setConf"),fe={monday:nn,tuesday:en,wednesday:tn,thursday:Je,friday:Qe,saturday:Ke,sunday:Ze},ki=c((t,n)=>{let i=[...t].map(()=>-1/0),r=[...t].sort((f,d)=>f.startTime-d.startTime||f.order-d.order),a=0;for(const f of r)for(let d=0;d<i.length;d++)if(f.startTime>=i[d]){i[d]=f.endTime,f.order=d+n,d>a&&(a=d);break}return a},"getMaxIntersections"),nt,Nt=1e4,yi=c(function(t,n,i,r){const a=dt().gantt,f=dt().securityLevel;let d;f==="sandbox"&&(d=Tt("#i"+n));const T=f==="sandbox"?Tt(d.nodes()[0].contentDocument.body):Tt("body"),E=f==="sandbox"?d.nodes()[0].contentDocument:document,Y=E.getElementById(n);nt=Y.parentElement.offsetWidth,nt===void 0&&(nt=1200),a.useWidth!==void 0&&(nt=a.useWidth);const x=r.db.getTasks();let L=[];for(const u of x)L.push(u.type);L=h(L);const M={};let D=2*a.topPadding;if(r.db.getDisplayMode()==="compact"||a.displayMode==="compact"){const u={};for(const v of x)u[v.section]===void 0?u[v.section]=[v]:u[v.section].push(v);let b=0;for(const v of Object.keys(u)){const k=ki(u[v],b)+1;b+=k,D+=k*(a.barHeight+a.barGap),M[v]=k}}else{D+=x.length*(a.barHeight+a.barGap);for(const u of L)M[u]=x.filter(b=>b.type===u).length}Y.setAttribute("viewBox","0 0 "+nt+" "+D);const z=T.select(`[id="${n}"]`),I=Ge().domain([Xe(x,function(u){return u.startTime}),je(x,function(u){return u.endTime})]).rangeRound([0,nt-a.leftPadding-a.rightPadding]);function S(u,b){const v=u.startTime,k=b.startTime;let m=0;return v>k?m=1:v<k&&(m=-1),m}c(S,"taskCompare"),x.sort(S),C(x,nt,D),qe(z,D,nt,a.useMaxWidth),z.append("text").text(r.db.getDiagramTitle()).attr("x",nt/2).attr("y",a.titleTopMargin).attr("class","titleText");function C(u,b,v){const k=a.barHeight,m=k+a.barGap,o=a.topPadding,l=a.leftPadding,y=Ue().domain([0,L.length]).range(["#00B9FA","#F95002"]).interpolate(mn);F(m,o,l,b,v,u,r.db.getExcludes(),r.db.getIncludes()),R(l,o,b,v),O(u,m,o,l,k,y,b),A(m,o),p(l,o,b,v)}c(C,"makeGantt");function O(u,b,v,k,m,o,l){u.sort((e,_)=>e.vert===_.vert?0:e.vert?1:-1);const g=[...new Set(u.map(e=>e.order))].map(e=>u.find(_=>_.order===e));z.append("g").selectAll("rect").data(g).enter().append("rect").attr("x",0).attr("y",function(e,_){return _=e.order,_*b+v-2}).attr("width",function(){return l-a.rightPadding/2}).attr("height",b).attr("class",function(e){for(const[_,P]of L.entries())if(e.type===P)return"section section"+_%a.numberSectionStyles;return"section section0"}).enter();const w=z.append("g").selectAll("rect").data(u).enter(),s=r.db.getLinks();if(w.append("rect").attr("id",function(e){return e.id}).attr("rx",3).attr("ry",3).attr("x",function(e){return e.milestone?I(e.startTime)+k+.5*(I(e.endTime)-I(e.startTime))-.5*m:I(e.startTime)+k}).attr("y",function(e,_){return _=e.order,e.vert?a.gridLineStartPadding:_*b+v}).attr("width",function(e){return e.milestone?m:e.vert?.08*m:I(e.renderEndTime||e.endTime)-I(e.startTime)}).attr("height",function(e){return e.vert?x.length*(a.barHeight+a.barGap)+a.barHeight*2:m}).attr("transform-origin",function(e,_){return _=e.order,(I(e.startTime)+k+.5*(I(e.endTime)-I(e.startTime))).toString()+"px "+(_*b+v+.5*m).toString()+"px"}).attr("class",function(e){const _="task";let P="";e.classes.length>0&&(P=e.classes.join(" "));let N=0;for(const[X,$]of L.entries())e.type===$&&(N=X%a.numberSectionStyles);let W="";return e.active?e.crit?W+=" activeCrit":W=" active":e.done?e.crit?W=" doneCrit":W=" done":e.crit&&(W+=" crit"),W.length===0&&(W=" task"),e.milestone&&(W=" milestone "+W),e.vert&&(W=" vert "+W),W+=N,W+=" "+P,_+W}),w.append("text").attr("id",function(e){return e.id+"-text"}).text(function(e){return e.task}).attr("font-size",a.fontSize).attr("x",function(e){let _=I(e.startTime),P=I(e.renderEndTime||e.endTime);if(e.milestone&&(_+=.5*(I(e.endTime)-I(e.startTime))-.5*m,P=_+m),e.vert)return I(e.startTime)+k;const N=this.getBBox().width;return N>P-_?P+N+1.5*a.leftPadding>l?_+k-5:P+k+5:(P-_)/2+_+k}).attr("y",function(e,_){return e.vert?a.gridLineStartPadding+x.length*(a.barHeight+a.barGap)+60:(_=e.order,_*b+a.barHeight/2+(a.fontSize/2-2)+v)}).attr("text-height",m).attr("class",function(e){const _=I(e.startTime);let P=I(e.endTime);e.milestone&&(P=_+m);const N=this.getBBox().width;let W="";e.classes.length>0&&(W=e.classes.join(" "));let X=0;for(const[K,rt]of L.entries())e.type===rt&&(X=K%a.numberSectionStyles);let $="";return e.active&&(e.crit?$="activeCritText"+X:$="activeText"+X),e.done?e.crit?$=$+" doneCritText"+X:$=$+" doneText"+X:e.crit&&($=$+" critText"+X),e.milestone&&($+=" milestoneText"),e.vert&&($+=" vertText"),N>P-_?P+N+1.5*a.leftPadding>l?W+" taskTextOutsideLeft taskTextOutside"+X+" "+$:W+" taskTextOutsideRight taskTextOutside"+X+" "+$+" width-"+N:W+" taskText taskText"+X+" "+$+" width-"+N}),dt().securityLevel==="sandbox"){let e;e=Tt("#i"+n);const _=e.nodes()[0].contentDocument;w.filter(function(P){return s.has(P.id)}).each(function(P){var N=_.querySelector("#"+P.id),W=_.querySelector("#"+P.id+"-text");const X=N.parentNode;var $=_.createElement("a");$.setAttribute("xlink:href",s.get(P.id)),$.setAttribute("target","_top"),X.appendChild($),$.appendChild(N),$.appendChild(W)})}}c(O,"drawRects");function F(u,b,v,k,m,o,l,y){if(l.length===0&&y.length===0)return;let g,w;for(const{startTime:N,endTime:W}of o)(g===void 0||N<g)&&(g=N),(w===void 0||W>w)&&(w=W);if(!g||!w)return;if(j(w).diff(j(g),"year")>5){ot.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const s=r.db.getDateFormat(),V=[];let e=null,_=j(g);for(;_.valueOf()<=w;)r.db.isInvalidDate(_,s,l,y)?e?e.end=_:e={start:_,end:_}:e&&(V.push(e),e=null),_=_.add(1,"d");z.append("g").selectAll("rect").data(V).enter().append("rect").attr("id",N=>"exclude-"+N.start.format("YYYY-MM-DD")).attr("x",N=>I(N.start.startOf("day"))+v).attr("y",a.gridLineStartPadding).attr("width",N=>I(N.end.endOf("day"))-I(N.start.startOf("day"))).attr("height",m-b-a.gridLineStartPadding).attr("transform-origin",function(N,W){return(I(N.start)+v+.5*(I(N.end)-I(N.start))).toString()+"px "+(W*u+.5*m).toString()+"px"}).attr("class","exclude-range")}c(F,"drawExcludeDays");function H(u,b,v,k){if(v<=0||u>b)return 1/0;const m=b-u,o=j.duration({[k??"day"]:v}).asMilliseconds();return o<=0?1/0:Math.ceil(m/o)}c(H,"getEstimatedTickCount");function R(u,b,v,k){const m=r.db.getDateFormat(),o=r.db.getAxisFormat();let l;o?l=o:m==="D"?l="%d":l=a.axisFormat??"%Y-%m-%d";let y=xn(I).tickSize(-k+b+a.gridLineStartPadding).tickFormat(ne(l));const w=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(r.db.getTickInterval()||a.tickInterval);if(w!==null){const s=parseInt(w[1],10);if(isNaN(s)||s<=0)ot.warn(`Invalid tick interval value: "${w[1]}". Skipping custom tick interval.`);else{const V=w[2],e=r.db.getWeekday()||a.weekday,_=I.domain(),P=_[0],N=_[1],W=H(P,N,s,V);if(W>Nt)ot.warn(`The tick interval "${s}${V}" would generate ${W} ticks, which exceeds the maximum allowed (${Nt}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(V){case"millisecond":y.ticks(ce.every(s));break;case"second":y.ticks(oe.every(s));break;case"minute":y.ticks(ae.every(s));break;case"hour":y.ticks(se.every(s));break;case"day":y.ticks(re.every(s));break;case"week":y.ticks(fe[e].every(s));break;case"month":y.ticks(ie.every(s));break}}}if(z.append("g").attr("class","grid").attr("transform","translate("+u+", "+(k-50)+")").call(y).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),r.db.topAxisEnabled()||a.topAxis){let s=Tn(I).tickSize(-k+b+a.gridLineStartPadding).tickFormat(ne(l));if(w!==null){const V=parseInt(w[1],10);if(isNaN(V)||V<=0)ot.warn(`Invalid tick interval value: "${w[1]}". Skipping custom tick interval.`);else{const e=w[2],_=r.db.getWeekday()||a.weekday,P=I.domain(),N=P[0],W=P[1];if(H(N,W,V,e)<=Nt)switch(e){case"millisecond":s.ticks(ce.every(V));break;case"second":s.ticks(oe.every(V));break;case"minute":s.ticks(ae.every(V));break;case"hour":s.ticks(se.every(V));break;case"day":s.ticks(re.every(V));break;case"week":s.ticks(fe[_].every(V));break;case"month":s.ticks(ie.every(V));break}}}z.append("g").attr("class","grid").attr("transform","translate("+u+", "+b+")").call(s).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}c(R,"makeGrid");function A(u,b){let v=0;const k=Object.keys(M).map(m=>[m,M[m]]);z.append("g").selectAll("text").data(k).enter().append(function(m){const o=m[0].split(rn.lineBreakRegex),l=-(o.length-1)/2,y=E.createElementNS("http://www.w3.org/2000/svg","text");y.setAttribute("dy",l+"em");for(const[g,w]of o.entries()){const s=E.createElementNS("http://www.w3.org/2000/svg","tspan");s.setAttribute("alignment-baseline","central"),s.setAttribute("x","10"),g>0&&s.setAttribute("dy","1em"),s.textContent=w,y.appendChild(s)}return y}).attr("x",10).attr("y",function(m,o){if(o>0)for(let l=0;l<o;l++)return v+=k[o-1][1],m[1]*u/2+v*u+b;else return m[1]*u/2+b}).attr("font-size",a.sectionFontSize).attr("class",function(m){for(const[o,l]of L.entries())if(m[0]===l)return"sectionTitle sectionTitle"+o%a.numberSectionStyles;return"sectionTitle"})}c(A,"vertLabels");function p(u,b,v,k){const m=r.db.getTodayMarker();if(m==="off")return;const o=z.append("g").attr("class","today"),l=new Date,y=o.append("line");y.attr("x1",I(l)+u).attr("x2",I(l)+u).attr("y1",a.titleTopMargin).attr("y2",k-a.titleTopMargin).attr("class","today"),m!==""&&y.attr("style",m.replace(/,/g,";"))}c(p,"drawToday");function h(u){const b={},v=[];for(let k=0,m=u.length;k<m;++k)Object.prototype.hasOwnProperty.call(b,u[k])||(b[u[k]]=!0,v.push(u[k]));return v}c(h,"checkUnique")},"draw"),gi={setConf:mi,draw:yi},pi=c(t=>`
  .mermaid-main-font {
        font-family: ${t.fontFamily};
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${t.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: ${t.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .vert {
    stroke: ${t.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${t.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: ${t.fontFamily};
  }
`,"getStyles"),vi=pi,Ti={parser:An,db:hi,renderer:gi,styles:vi};export{Ti as diagram};
