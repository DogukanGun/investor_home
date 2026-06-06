package de.investorhome.ui.theme

import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.Dp

fun Modifier.marginBottom(dp: Dp): Modifier = this.padding(bottom = dp)
fun Modifier.marginTop(dp: Dp): Modifier = this.padding(top = dp)
fun Modifier.marginStart(dp: Dp): Modifier = this.padding(start = dp)
fun Modifier.marginEnd(dp: Dp): Modifier = this.padding(end = dp)
fun Modifier.margin(dp: Dp): Modifier = this.padding(dp)
